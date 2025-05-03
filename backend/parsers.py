import re


def parse_kick_category_object(categoryObject):
    parsed_category_object = []
    for category in categoryObject:
        parsed_category_object.append(
            {
                "id": category.get("id"),
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
        second_last_element = parts[-2]
        cleaned_element = re.sub(r"\s\d{2,}w$", "", second_last_element)
        return cleaned_element


def parse_public_kick_stream_object(kickObject):
    parsed_kick_object = {
        "id": kickObject.get("broadcaster_user_id"),
        "user_id": kickObject.get("broadcaster_user_id"),
        "slug": kickObject.get("slug"),
        "user": {"username": kickObject.get("slug")},
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
    return [parse_kick_stream_twitch_format(stream) for stream in kickObject]


def parse_kick_response_data(response_data):
    return {
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
