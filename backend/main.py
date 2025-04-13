import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
import json
from curl_cffi import requests
import os
from dotenv import load_dotenv

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
redis_client = Redis(host="redis", port=6379, decode_responses=True)

load_dotenv()

KICK_API_KEY = os.getenv("KICK_API_KEY")

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
        response = requests.get(
            url=f"https://api.kick.com/public/v1/channels?slug={streamer}",
            headers={"Authorization": f"Bearer {KICK_API_KEY}"},
        )

        if response.status_code == 404:
            error_data = {"error": "Channel not found"}
            await redis_client.setex(streamer, 180, json.dumps(error_data))
            raise HTTPException(status_code=404, detail="Channel not found")

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        channel_data = response.json()
        if not channel_data.get("data"):
            error_data = {"error": "Channel not found"}
            await redis_client.setex(streamer, 180, json.dumps(error_data))
            raise HTTPException(status_code=404, detail="Channel not found")

        user_id = channel_data["data"][0].get("broadcaster_user_id")

        # Get username from users API
        response = requests.get(
            url=f"https://api.kick.com/public/v1/users?id={user_id}",
            headers={"Authorization": f"Bearer {KICK_API_KEY}"},
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching user data from kick API",
            )

        user_data = response.json()
        if not user_data.get("data"):
            error_data = {"error": "User not found"}
            await redis_client.setex(streamer, 180, json.dumps(error_data))
            raise HTTPException(status_code=404, detail="User not found")

        result = {"user": {"username": user_data["data"][0]["name"]}}

        # Cache the result for 180 seconds
        await redis_client.setex(streamer, 180, json.dumps(result))
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
            # Check cache first for each streamer in chunk
            for streamer in chunk[:]:  # Create a copy of the list for iteration
                cached_data = await redis_client.get(streamer)
                if cached_data:
                    print(f"Cache hit for streamer {streamer}")
                    parsed_data = json.loads(cached_data)
                    temp_slug_to_data[streamer.lower()] = parsed_data
                    if "error" not in parsed_data:
                        user_ids.add(str(parsed_data.get("user_id")))
                    chunk.remove(streamer)

            if not chunk:  # Skip if all streamers were in cache
                continue

            # Build URL with multiple slug parameters (max 50)
            slug_params = "&".join([f"slug={streamer.lower()}" for streamer in chunk])
            url = f"https://api.kick.com/public/v1/channels?{slug_params}"

            # Fetch data for current chunk
            response = requests.get(
                url=url,
                headers={"Authorization": f"Bearer {KICK_API_KEY}"},
            )

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

                # Cache the parsed data
                await redis_client.setex(streamer, 180, json.dumps(parsed_data))
                temp_slug_to_data[streamer.lower()] = parsed_data

            # Handle not found streamers
            response_streamers = {
                data.get("slug").lower() for data in response_data.get("data", [])
            }
            for streamer in chunk:
                if streamer.lower() not in response_streamers:
                    error_data = {"error": "Streamer not found"}
                    temp_slug_to_data[streamer.lower()] = error_data
                    await redis_client.setex(streamer, 180, json.dumps(error_data))

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
        cache_key = f"subcategories_{page}_{limit}"
        # Check if data is in cache
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            print(f"Cache hit for subcategories page {page}, limit {limit}")
            return json.loads(cached_data)

        print(f"Cache miss for subcategories page {page}, limit {limit}")
        # Fetch data from API
        response = requests.get(
            url=f"https://kick.com/api/v1/subcategories?page={page}&limit={limit}",
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
            # return json response with empty data
            response_end_list = {
                "reached_end": True,
                "data": [],
            }
            await redis_client.setex(cache_key, 180, json.dumps(response_end_list))
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

        # Cache data for 180 seconds (3 minutes)
        await redis_client.setex(cache_key, 180, json.dumps(return_data))
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
        cache_key = f"livestreams_{page}_{limit}_{subcategory}_{sort}"
        # Check if data is in cache
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            print(
                f"Cache hit for livestreams page {page}, limit {limit}, subcategory {subcategory}, sort {sort}"
            )
            return json.loads(cached_data)

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
            # return json response with empty data
            response_end_list = {
                "reached_end": True,
                "data": [],
            }
            await redis_client.setex(cache_key, 180, json.dumps(response_end_list))
            return response_end_list

        return_data = {
            "current_page": response_data.get("current_page"),
            "first_page_url": response_data.get("first_page_url"),
            "from": response_data.get("from"),
            "next_page_url": response_data.get("next_page_url"),
            "per_page": response_data.get("per_page"),
            "prev_page_url": response_data.get("prev_page_url"),
            "to": response_data.get("to"),
            "reached_end": False,
            "data": parse_kick_stream_array_object(response_data.get("data")),
        }
        # Cache data for 180 seconds (3 minutes)
        await redis_client.setex(cache_key, 180, json.dumps(return_data))
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


def parse_kick_category_object(categoryObject):
    parsed_category_object = []
    for category in categoryObject:
        parsed_category_object.append(
            {
                "id": category.get("slug"),
                "name": category.get("name"),
                "box_art_url": extract_link(category),
            }
        )

    return parsed_category_object


def extract_link(category):
    if category.get("banner") is None:
        return None
    text = category.get("banner").get("responsive")
    parts = text.split(", ")
    if len(parts) < 2:
        return parts[0]
    else:
        # Get the second last element
        second_last_element = parts[-2]
        # Use regex to remove the pattern of {digits}w at the end of the string
        cleaned_element = re.sub(r"\s\d{2,}w$", "", second_last_element)
        return cleaned_element


def parse_public_kick_stream_object(kickObject):
    parsed_kick_object = {
        "id": kickObject.get("broadcaster_user_id"),
        "user_id": kickObject.get("broadcaster_user_id"),
        "slug": kickObject.get("slug"),
        "user": {
            "username": kickObject.get("slug")
        },  # znalezc opcje na dobre pokazanie kapitalizacji
        "livestream": (
            {
                "categories": (
                    [
                        {
                            "id": kickObject.get("category").get("id"),
                            "name": kickObject.get("category").get("name"),
                        }
                    ]
                ),
                "session_title": (kickObject.get("stream_title")),
                "viewer_count": kickObject.get("stream").get("viewer_count"),
                "created_at": kickObject.get("stream").get("start_time"),
                "language": kickObject.get("stream").get("language"),
                "thumbnail": {"url": kickObject.get("stream").get("thumbnail")},
                "is_mature": kickObject.get("stream").get("is_mature"),
                "is_live": kickObject.get("stream").get("is_live"),
            }
            if kickObject.get("stream").get("is_live")
            else None
        ),
    }

    return parsed_kick_object


def parse_kick_stream_object(kickObject):
    livestream = kickObject.get("livestream")

    parsed_kick_object = {
        "id": kickObject.get("id"),
        "user_id": kickObject.get("user_id"),
        "slug": kickObject.get("slug"),
        "user": {"username": kickObject.get("user").get("username")},
        "livestream": (
            {
                "categories": (
                    [
                        {
                            "id": livestream["categories"][0]["id"],
                            "name": livestream["categories"][0]["name"],
                        }
                    ]
                ),
                "session_title": (livestream.get("session_title")),
                "viewer_count": livestream.get("viewer_count"),
                "created_at": livestream.get("created_at").replace(" ", "T") + "Z",
                "language": livestream.get("language"),
                "thumbnail": {
                    "url": livestream["thumbnail"]["url"].replace("720", "160")
                },
                "is_mature": livestream.get("is_mature"),
            }
            if livestream is not None
            else None
        ),
    }

    return parsed_kick_object


def parse_kick_stream_twitch_format(kickObject):

    parsed_kick_object = {
        "id": kickObject.get("id"),
        "user_id": kickObject.get("channel").get("user_id"),
        "user_login": kickObject.get("channel").get("slug"),
        "user_name": kickObject.get("channel").get("user").get("username"),
        "game_id": kickObject["categories"][0]["id"],
        "game_name": kickObject["categories"][0]["name"],
        "title": kickObject.get("session_title"),
        "viewer_count": kickObject.get("viewer_count"),
        "started_at": kickObject.get("created_at").replace(" ", "T") + "Z",
        "language": kickObject.get("language"),
        "thumbnail_url": kickObject["thumbnail"]["src"].replace("720", "160"),
        "is_mature": kickObject.get("is_mature"),
        "platform": "Kick",
        "is_live": kickObject.get("is_live"),
        "type": "live",
    }

    return parsed_kick_object


def parse_kick_stream_array_object(kickObject):
    parsed_kick_object = []
    for stream in kickObject:
        parsed_kick_object.append(parse_kick_stream_twitch_format(stream))

    return parsed_kick_object


async def fetch_user_details(user_ids: list) -> dict:
    """Fetch user details from Kick API and return a mapping of user_id to username"""
    try:
        # Build URL with multiple id parameters
        id_params = "&".join([f"id={user_id}" for user_id in user_ids])
        url = f"https://api.kick.com/public/v1/users?{id_params}"

        response = requests.get(
            url=url,
            headers={"Authorization": f"Bearer {KICK_API_KEY}"},
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
