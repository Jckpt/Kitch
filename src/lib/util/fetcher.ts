type UserTwitchKey = {
  user_id: string
  access_token: string
  client_id: string
}

export const twitchFetcher = async (params) => {
  const [url, userTwitchKey] = params
  const headerValue = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${userTwitchKey?.access_token}`,
      "Client-Id": userTwitchKey?.client_id
    }
  }
  const data = await fetch(url, headerValue)
  return data.json()
}

export const getTwitchUser = async (credentials: UserTwitchKey) => {
  const response = await twitchFetcher([
    "https://api.twitch.tv/helix/users",
    credentials
  ])
  return response.data[0]
}
