// Importuj typy z osobnego pliku
import type {
  AuthenticatedRequestResult,
  FetchActiveStreamersResult,
  KickChannel,
  KickChannelsResponse,
  TokenResponse
} from "./types"

// Function to refresh OAuth token
export async function refreshToken(
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    const response = await fetch("https://id.kick.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (response.ok) {
      const tokenData = (await response.json()) as TokenResponse
      return tokenData.access_token
    }

    console.error("Error refreshing token:", response.status)
    return null
  } catch (error) {
    console.error("Exception while refreshing token:", error)
    return null
  }
}

// Function to make authenticated requests
export async function makeAuthenticatedRequest(
  url: string,
  token: string,
  clientId: string,
  clientSecret: string
): Promise<AuthenticatedRequestResult> {
  try {
    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // If we get 401, try to refresh token
    if (response.status === 401) {
      console.log("Received 401 error, attempting to refresh token...")
      const newToken = await refreshToken(clientId, clientSecret)

      if (newToken) {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${newToken}`
          }
        })
        console.log("Request retried with new token")
        // Return new token so it can be saved
        return { response, newToken }
      }
    }

    return { response }
  } catch (error) {
    console.error("Error making request:", error)
    return { response: null }
  }
}

// Function to fetch active streamers from Kick API
export async function fetchActiveStreamers(
  streamers: string[],
  token: string,
  clientId: string,
  clientSecret: string
): Promise<FetchActiveStreamersResult> {
  if (streamers.length === 0) {
    return { streamers: [] }
  }

  const activeStreamers: KickChannel[] = []
  const CHUNK_SIZE = 20 // seems like API returns bad data if batch size is too high
  let currentToken = token
  let tokenWasRefreshed = false

  // Split into chunks of 50 (API limit)
  for (let i = 0; i < streamers.length; i += CHUNK_SIZE) {
    const chunk = streamers.slice(i, i + CHUNK_SIZE)

    // Budujemy URL z parametrami slug
    const slugParams = chunk
      .map((s) => `slug=${encodeURIComponent(s.toLowerCase())}`)
      .join("&")
    const url = `https://api.kick.com/public/v1/channels?${slugParams}`

    // Pobieramy dane
    const result = await makeAuthenticatedRequest(
      url,
      currentToken,
      clientId,
      clientSecret
    )

    // If token was refreshed, save it
    if (result.newToken) {
      currentToken = result.newToken
      tokenWasRefreshed = true
      console.log("Token refreshed during streamer fetch")
    }

    if (!result.response || result.response.status !== 200) {
      console.error(`Error fetching data for chunk: ${chunk.join(", ")}`)
      continue
    }

    const data = (await result.response.json()) as KickChannelsResponse

    // Filter only active streamers and return raw data from API
    for (const streamerData of data.data || []) {
      if (streamerData.stream && streamerData.stream.is_live) {
        activeStreamers.push(streamerData)
      }
    }
  }

  return {
    streamers: activeStreamers,
    newToken: tokenWasRefreshed ? currentToken : undefined
  }
}
