import { type UserTwitchKey } from "../types/twitchTypes"
import { kickApiUrl } from "./kickApi"

export const TWITCH_CLIENT_ID = "256lknox4x75bj30rwpctxna2ckbmn"
export const TWITCH_REDIRECT_URI = "https://kitch.pl/"

type TwitchTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string[]
  token_type: string
}

export class TwitchAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "TwitchAuthError"
    this.status = status
  }
}

const postTokenRequest = async (
  path: "/api/twitch/token" | "/api/twitch/refresh",
  body: Record<string, string>
) => {
  const response = await fetch(kickApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new TwitchAuthError(
      `Twitch authentication failed with status ${response.status}`,
      response.status
    )
  }

  const token = (await response.json()) as Partial<TwitchTokenResponse>
  if (
    typeof token.access_token !== "string" ||
    typeof token.refresh_token !== "string"
  ) {
    throw new TwitchAuthError("Twitch returned an invalid token response", 502)
  }

  return token as TwitchTokenResponse
}

export const createTwitchOAuthState = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  )
}

export const getTwitchOAuthURL = (state: string) => {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: "code",
    scope: "user:read:follows",
    state
  })

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`
}

export const exchangeTwitchAuthorizationCode = (code: string) =>
  postTokenRequest("/api/twitch/token", { code })

export const refreshTwitchCredentials = async (
  credentials: UserTwitchKey
): Promise<UserTwitchKey> => {
  if (!credentials.refresh_token) {
    throw new TwitchAuthError("Twitch credentials cannot be refreshed", 401)
  }

  const token = await postTokenRequest("/api/twitch/refresh", {
    refresh_token: credentials.refresh_token
  })

  return {
    ...credentials,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    auth_version: 2
  }
}
