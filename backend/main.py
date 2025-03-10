import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
import json
from curl_cffi import requests

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
redis_client = Redis(host="redis", port=6379, decode_responses=True)


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
@limiter.limit("15/minute")
async def get_channel_data(streamer: str, request: Request):
    try:
        # Check if data or 404 error is in cache
        cached_data = await redis_client.get(streamer)
        if cached_data:
            print(f"Cache hit for streamer {streamer}")
            cached_response = json.loads(cached_data)
            if "error" in cached_response:
                raise HTTPException(status_code=404, detail=cached_response["error"])
            return cached_response

        print(f"Cache miss for streamer {streamer}")
        # Fetch data from API
        response = requests.get(
            url=f"https://kick.com/api/v1/channels/{streamer}",
            impersonate="chrome120",
            headers={
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en,en-US;q=0.9,pl-PL;q=0.8,pl;q=0.7",
                "cache-control": "max-age=0",
                "priority": "u=0, i",
                "sec-ch-ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                "sec-ch-ua-arch": '"x86"',
                "sec-ch-ua-bitness": '"64"',
                "sec-ch-ua-full-version": '"125.0.6422.78"',
                "sec-ch-ua-full-version-list": '"Google Chrome";v="125.0.6422.78", "Chromium";v="125.0.6422.78", "Not.A/Brand";v="24.0.0.0"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-model": '""',
                "sec-ch-ua-platform": '"Windows"',
                "sec-ch-ua-platform-version": '"15.0.0"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            },
        )

        if response.status_code == 404:
            error_message = "Channel not found"
            # Cache the 404 error for 180 seconds
            await redis_client.setex(
                streamer, 180, json.dumps({"error": error_message})
            )
            raise HTTPException(status_code=404, detail=error_message)
        elif response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        response_data = response.json()
        # Process data to include only the necessary fields for the frontend
        parsed_data = parse_kick_stream_object(response_data)
        # Cache processed data for 180 seconds (3 minutes)
        await redis_client.setex(streamer, 180, json.dumps(parsed_data))
        return parsed_data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching data for streamer {streamer}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


@app.get("/api/channels")
@limiter.limit("3/minute")
async def get_channels_data(streamers: str, request: Request):
    try:
        streamers_list = streamers.split(
            ","
        )  # Rozdzielamy listę streamerów po przecinkach

        # Tworzymy słownik, w którym kluczem będzie nazwa streamera, a wartością będzie dane streamera
        channels_data = {}

        for streamer in streamers_list:
            try:
                # Check if data is in cache
                cached_data = await redis_client.get(streamer)
                if cached_data:
                    print(f"Cache hit for streamer {streamer}")
                    channels_data[streamer] = json.loads(cached_data)
                else:
                    print(f"Cache miss for streamer {streamer}")
                    # Fetch data from API
                    response = requests.get(
                        url=f"https://kick.com/api/v1/channels/{streamer}",
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

                    # Process data to include only the necessary fields for the frontend
                    parsed_data = parse_kick_stream_object(response_data)

                    # Cache processed data for 180 seconds (3 minutes)
                    await redis_client.setex(streamer, 180, json.dumps(parsed_data))

                    channels_data[streamer] = parsed_data
            except Exception as e:
                print(f"Error fetching data for streamer {streamer}: {str(e)}")
                channels_data[streamer] = {
                    "error": str(e)
                }  # Zapisujemy błąd, jeśli wystąpił

        return channels_data

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
