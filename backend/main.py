from fastapi import FastAPI, HTTPException
from redis.asyncio import Redis
import json
from curl_cffi import requests

app = FastAPI()
redis_client = Redis(host="redis", port=6379, decode_responses=True)


@app.get("/api/channel/{streamer}")
async def get_channel_data(streamer: str):
    try:
        # Sprawdź, czy dane są w cache
        cached_data = await redis_client.get(streamer)
        if cached_data:
            print(f"Cache hit for streamer {streamer}")
            return json.loads(cached_data)

        print(f"Cache miss for streamer {streamer}")
        # Pobierz dane z API
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

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error fetching data from kick API",
            )

        response_data = response.json()

        # Zapisz dane do cache na 180 sekund (3 minuty)
        await redis_client.setex(streamer, 180, json.dumps(response_data))

        return response_data

    except Exception as e:
        print(f"Error fetching data for streamer {streamer}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching data"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
