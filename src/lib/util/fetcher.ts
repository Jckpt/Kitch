import { type UserTwitchKey } from "../types/twitchTypes"

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

export const getTwitchUserId = async (credentials) => {
  const data = await twitchFetcher([
    "https://api.twitch.tv/helix/users",
    credentials
  ])
  return data.data[0].id
}

export const getTwitchOAuthURL = () => {
  const BASE_URL = "https://id.twitch.tv/oauth2/authorize"
  const REDIRECT_URI = chrome.identity.getRedirectURL()
  const CLIENT_ID = "256lknox4x75bj30rwpctxna2ckbmn"
  const SCOPE = "user:read:follows"
  const FINAL_URL = `${BASE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&force_verify=true&response_type=token&scope=${SCOPE}`
  return FINAL_URL
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
