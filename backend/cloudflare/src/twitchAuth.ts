import type { TwitchEnv } from "./env"

const TWITCH_REDIRECT_URI = "https://kitch.pl/"

export async function exchangeTwitchCode(code: string, twitchEnv: TwitchEnv) {
  return requestTwitchToken(
    new URLSearchParams({
      client_id: twitchEnv.TWITCH_CLIENT_ID,
      client_secret: twitchEnv.TWITCH_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: TWITCH_REDIRECT_URI
    })
  )
}

export async function refreshTwitchToken(
  refreshToken: string,
  twitchEnv: TwitchEnv
) {
  return requestTwitchToken(
    new URLSearchParams({
      client_id: twitchEnv.TWITCH_CLIENT_ID,
      client_secret: twitchEnv.TWITCH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  )
}

async function requestTwitchToken(params: URLSearchParams) {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json"
    }
  })
}
