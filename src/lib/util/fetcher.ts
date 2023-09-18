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
