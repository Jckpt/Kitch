import { type UserTwitchKey } from "~lib/types/twitchTypes"

export const twitchFetcher = async (params) => {
  const [url, userTwitchKey] = params
  if (!userTwitchKey || url === null) return
  const headerValue = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${userTwitchKey?.access_token}`,
      "Client-Id": userTwitchKey?.client_id
    }
  }
  const response = await fetch(url, headerValue)
  let data = await response.json()
  data = { ...data, platform: "Twitch" }
  return data
}

export const getTwitchUser = async (credentials: UserTwitchKey) => {
  const data = await twitchFetcher([
    "https://api.twitch.tv/helix/users",
    credentials
  ])
  return data.data[0]
}

export const getTwitchStreamer = async (
  credentials: UserTwitchKey,
  user_id: string
) => {
  const data = await twitchFetcher([
    `https://api.twitch.tv/helix/users?id=${user_id}`,
    credentials
  ])

  return data.data[0]
}
