from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from curl_cffi import requests
import os
from dotenv import load_dotenv
from parsers import (
    parse_kick_category_object,
    parse_public_kick_stream_object,
    parse_kick_stream_array_object,
    parse_kick_response_data,
)
import ssl
import redis
from auth_manager import auth_manager

app = FastAPI()

load_dotenv()

PROXY_URL = os.getenv("PROXY_URL")
BRIGHTDATA_API_KEY = os.getenv("BRIGHTDATA_API_KEY")
proxies = {"http": PROXY_URL, "https": PROXY_URL}

ssl._create_default_https_context = ssl._create_unverified_context

# Redis client initialization
redis_client = redis.Redis(host="redis", port=6379, db=0, decode_responses=True)

# Ustawienie zezwoleń CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # Możesz też zmienić "*" na konkretny adres URL swojej aplikacji frontendowej
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/api/channel/{streamer}")
async def get_channel_data(streamer: str, request: Request):
    try:
        # First get user_id from channels API
        response = auth_manager.make_authenticated_request(
            method="GET",
            url=f"https://api.kick.com/public/v1/channels?slug={streamer}",
        )

        if response.status_code == 404:
            error_data = {"error": "Channel not found"}
            raise HTTPException(status_code=404, detail="Channel not found")

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        channel_data = response.json()
        if not channel_data.get("data"):
            error_data = {"error": "Channel not found"}
            raise HTTPException(status_code=404, detail="Channel not found")

        user_id = channel_data["data"][0].get("broadcaster_user_id")

        # Get username from users API
        response = auth_manager.make_authenticated_request(
            method="GET",
            url=f"https://api.kick.com/public/v1/users?id={user_id}",
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching user data from kick API",
            )

        user_data = response.json()
        if not user_data.get("data"):
            error_data = {"error": "User not found"}
            raise HTTPException(status_code=404, detail="User not found")

        result = {"user": {"username": user_data["data"][0]["name"]}}
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching data for streamer {streamer}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/channels")
async def get_channels_data(streamers: str, request: Request):
    try:
        streamers_list = streamers.split(",")
        channels_data = {}
        user_ids = set()

        # Split streamers into chunks of 50
        def chunk_list(lst, chunk_size):
            return [lst[i : i + chunk_size] for i in range(0, len(lst), chunk_size)]

        streamer_chunks = chunk_list(streamers_list, 50)
        temp_slug_to_data = {}  # Temporary storage for mapping slugs to data

        # Process each chunk
        for chunk in streamer_chunks:
            # Build URL with multiple slug parameters (max 50)
            slug_params = "&".join([f"slug={streamer.lower()}" for streamer in chunk])
            url = f"https://api.kick.com/public/v1/channels?{slug_params}"

            # Fetch data for current chunk
            response = auth_manager.make_authenticated_request(
                method="GET",
                url=url,
            )

            print(f"response: {response}")

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error fetching data from kick API for chunk: {chunk}",
                )

            response_data = response.json()

            # Process each streamer's data from the response
            for streamer_data in response_data.get("data", []):
                streamer = streamer_data.get("slug")
                parsed_data = parse_public_kick_stream_object(streamer_data)

                if broadcaster_id := streamer_data.get("broadcaster_user_id"):
                    user_ids.add(str(broadcaster_id))

                temp_slug_to_data[streamer.lower()] = parsed_data

            # Handle not found streamers
            response_streamers = {
                data.get("slug").lower() for data in response_data.get("data", [])
            }
            for streamer in chunk:
                if streamer.lower() not in response_streamers:
                    error_data = {"error": "Streamer not found"}
                    temp_slug_to_data[streamer.lower()] = error_data

        # Fetch proper usernames for all collected user_ids
        if user_ids:
            user_id_chunks = chunk_list(list(user_ids), 50)
            all_user_details = {}

            for id_chunk in user_id_chunks:
                user_details = await fetch_user_details(id_chunk)
                all_user_details.update(user_details)

            # Create final response with proper usernames as keys
            for slug, data in temp_slug_to_data.items():
                if "error" not in data:
                    user_id = str(data.get("user_id"))
                    if user_id in all_user_details:
                        proper_username = all_user_details[user_id]
                        data["user"]["username"] = proper_username
                        channels_data[proper_username] = data
                    else:
                        channels_data[slug] = data
                else:
                    channels_data[slug] = data

            return channels_data

        return temp_slug_to_data  # Return original data if no user_ids were collected

    except Exception as e:
        print(f"Error fetching data for streamers {streamers}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/subcategories")
async def get_subcategories(request: Request, page: int = 1, limit: int = 20):
    try:
        # Try to get data from Redis
        cache_key = f"subcategories:{page}:{limit}"
        cached_data = redis_client.get(cache_key)

        if cached_data:
            return json.loads(cached_data)

        print(f"Cache miss for subcategories page {page}, limit {limit}")

        response = requests.post(
            url="https://api.brightdata.com/request",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {BRIGHTDATA_API_KEY}",
            },
            json={
                "zone": "web_unlocker1",
                "url": f"https://kick.com/api/v1/subcategories?page={page}&limit={limit}",
                "format": "raw",
            },
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from Brightdata API",
            )

        response_data = response.json()

        if response_data.get("current_page") != page or response_data.get("data") == []:
            response_end_list = {
                "reached_end": True,
                "data": [],
            }
            return response_end_list

        return_data = {
            "current_page": response_data.get("current_page"),
            "next_page_url": response_data.get("next_page_url"),
            "per_page": response_data.get("per_page"),
            "prev_page_url": response_data.get("prev_page_url"),
            "to": response_data.get("to"),
            "total": response_data.get("total"),
            "reached_end": False,
            "data": parse_kick_category_object(response_data.get("data")),
        }

        # Cache the data for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(return_data))

        return return_data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching subcategories for page {page}, limit {limit}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/livestreams")
async def get_livestreams(
    request: Request,
    page: int = 1,
    limit: int = 32,
    subcategory: str = "",
    sort: str = "desc",
):
    try:
        print(
            f"Cache miss for livestreams page {page}, limit {limit}, subcategory {subcategory}, sort {sort}"
        )
        # Fetch data from API
        url = f"https://kick.com/stream/livestreams/en?page={page}&limit={limit}&sort={sort}"
        if subcategory:
            url += f"&subcategory={subcategory}"

        response = requests.get(
            url=url,
            impersonate="chrome120",
            headers={
                "accept": "application/json",
                "accept-language": "en,en-US;q=0.9",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            },
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        response_data = response.json()

        if response_data.get("current_page") != page or response_data.get("data") == []:
            response_end_list = {
                "reached_end": True,
                "data": [],
            }
            return response_end_list

        return_data = parse_kick_response_data(
            response_data, parse_kick_stream_array_object
        )
        return return_data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(
            f"Error fetching livestreams for page {page}, limit {limit}, subcategory {subcategory}, sort {sort}: {str(e)}"
        )
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/v2/livestreams")
async def get_livestreams_v2(request: Request):
    try:
        category_id = request.query_params.get("category_id", "")

        # Create cache key based on category_id
        cache_key = (
            f"livestreams_v2:{category_id}" if category_id else "livestreams_v2:all"
        )
        cached_data = redis_client.get(cache_key)

        if cached_data:
            return json.loads(cached_data)

        if category_id:
            url = f"https://api.kick.com/public/v1/livestreams?category_id={category_id}&limit=100&sort=viewer_count"
        else:
            url = (
                "https://api.kick.com/public/v1/livestreams?limit=100&sort=viewer_count"
            )

        response = auth_manager.make_authenticated_request(
            method="GET",
            url=url,
            use_secondary=True
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        response_data = response.json()

        # Cache the successful response for 5 minutes
        redis_client.setex(cache_key, 300, json.dumps(response_data))

        return response_data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching v2 livestreams: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/v2/categories")
async def get_categories_v2(request: Request):
    try:
        query = request.query_params.get("query", "")
        page = request.query_params.get("page", 1)
        if query:
            url = f"https://api.kick.com/public/v1/categories?q={query}"
        else:
            # Default to fetching all categories if no query is provided
            url = "https://api.kick.com/public/v1/categories"

        response = auth_manager.make_authenticated_request(
            method="GET",
            url=url,
            use_secondary=True
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        response_data = response.json()

        return response_data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching v2 livestreams: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/v2/channels")
async def get_channels_data_v2(streamers: str, request: Request):
    try:
        streamers_list = streamers.split(",")
        temp_slug_to_data = {}  # Temporary storage for mapping slugs to data

        # Split streamers into chunks of 50
        def chunk_list(lst, chunk_size):
            return [lst[i : i + chunk_size] for i in range(0, len(lst), chunk_size)]

        streamer_chunks = chunk_list(streamers_list, 50)

        # Process each chunk
        for chunk in streamer_chunks:
            # Build URL with multiple slug parameters (max 50)
            slug_params = "&".join([f"slug={streamer.lower()}" for streamer in chunk])
            url = f"https://api.kick.com/public/v1/channels?{slug_params}"

            # Fetch data for current chunk
            response = auth_manager.make_authenticated_request(
                method="GET",
                url=url,
            )

            print(f"response: {response}")

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error fetching data from kick API for chunk: {chunk}",
                )

            response_data = response.json()

            # Process each streamer's data from the response
            for streamer_data in response_data.get("data", []):
                streamer = streamer_data.get("slug")
                parsed_data = parse_public_kick_stream_object(streamer_data)
                temp_slug_to_data[streamer.lower()] = parsed_data

            # Handle not found streamers
            response_streamers = {
                data.get("slug").lower() for data in response_data.get("data", [])
            }
            for streamer in chunk:
                if streamer.lower() not in response_streamers:
                    error_data = {"error": "Streamer not found"}
                    temp_slug_to_data[streamer.lower()] = error_data

        return temp_slug_to_data

    except Exception as e:
        print(f"Error fetching data for streamers {streamers}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


async def fetch_user_details(user_ids: list) -> dict:
    """Fetch user details from Kick API and return a mapping of user_id to username"""
    try:
        # Build URL with multiple id parameters
        id_params = "&".join([f"id={user_id}" for user_id in user_ids])
        url = f"https://api.kick.com/public/v1/users?{id_params}"

        response = auth_manager.make_authenticated_request(
            method="GET",
            url=url,
        )

        if response.status_code != 200:
            print(f"Error fetching user details: {response.status_code}")
            return {}

        response_data = response.json()
        return {
            str(user["user_id"]): user["name"] for user in response_data.get("data", [])
        }
    except Exception as e:
        print(f"Error fetching user details: {str(e)}")
        return {}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
