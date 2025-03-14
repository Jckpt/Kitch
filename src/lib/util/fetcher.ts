import { type PlatformStream, type UserTwitchKey } from "../types/twitchTypes"

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
  const REDIRECT_URI = "https://kitch.pl/"
  const CLIENT_ID = "256lknox4x75bj30rwpctxna2ckbmn"
  const SCOPE = "user:read:follows"
  const FINAL_URL = `${BASE_URL}
                    ?client_id=${CLIENT_ID}&
                    redirect_uri=${REDIRECT_URI}&
                    force_verify=true&
                    response_type=token&
                    scope=${SCOPE}`
  return FINAL_URL
}

function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let text = ""
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function getKickOAuthURL(): Promise<string> {
  const BASE_URL = "https://id.kick.com/oauth/authorize"
  const REDIRECT_URI = "https://kitch.pl/"
  const CLIENT_ID = "01JMF9B77CK8B7JEN6XTM13PQK"
  const SCOPE = "user:read"
  const STATE = generateRandomString(32)
  const CODE_VERIFIER = generateRandomString(64)
  const CODE_CHALLENGE = await generateCodeChallenge(CODE_VERIFIER)
  const CODE_CHALLENGE_METHOD = "S256"

  // Store code_verifier for later use during token exchange
  await chrome.storage.local.set({ code_verifier: CODE_VERIFIER })

  const FINAL_URL = `${BASE_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=${CODE_CHALLENGE_METHOD}&state=${STATE}`

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

export const kickFetcher = async (url) => {
  if (url === null) return
  const response = await fetch(url)
  let data = await response.json()
  console.log(data)
  return data
}

function parseKickObject(kickObject) {
  const {
    id,
    user_id,
    slug,
    user: { username },
    livestream
  } = kickObject
  console.log(username, slug, livestream)
  const parsedKickObject = {
    id,
    user_id,
    user_login: slug,
    user_name: username,
    game_id: livestream.categories[0]?.id,
    game_name: livestream.categories[0]?.name,
    type: "live",
    title: livestream.session_title,
    viewer_count: livestream.viewer_count,
    started_at: livestream.created_at,
    language: livestream.language,
    thumbnail_url: livestream.thumbnail.url,
    tag_ids: null,
    is_mature: livestream.is_mature,
    platform: "Kick"
  } as PlatformStream

  return parsedKickObject
}
