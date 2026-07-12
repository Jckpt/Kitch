import { Storage } from "@plasmohq/storage"

import { type PlatformStream, type UserTwitchKey } from "../types/twitchTypes"
import { refreshTwitchCredentials, TwitchAuthError } from "./twitchAuth"

let refreshPromise: Promise<UserTwitchKey> | null = null
const refreshedCredentialsByAccessToken = new Map<string, UserTwitchKey>()

const resolveCurrentCredentials = (credentials: UserTwitchKey) => {
  let current = credentials
  let replacement = refreshedCredentialsByAccessToken.get(current.access_token)

  while (replacement) {
    current = replacement
    replacement = refreshedCredentialsByAccessToken.get(current.access_token)
  }

  return current
}

const fetchTwitch = (url: string, credentials: UserTwitchKey) =>
  fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${credentials.access_token}`,
      "Client-Id": credentials.client_id
    }
  })

const refreshStoredCredentials = async (credentials: UserTwitchKey) => {
  const currentCredentials = resolveCurrentCredentials(credentials)

  if (!refreshPromise) {
    refreshPromise = refreshTwitchCredentials(currentCredentials)
      .then(async (refreshedCredentials) => {
        refreshedCredentialsByAccessToken.set(
          currentCredentials.access_token,
          refreshedCredentials
        )
        await new Storage().set("userTwitchKey", refreshedCredentials)
        return refreshedCredentials
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const requestTwitchReauthorization = () => {
  void chrome.runtime.sendMessage({ type: "twitch-auth-required" })
}

export async function twitchFetcher<T extends object = Record<string, unknown>>(
  params
): Promise<(T & { platform: string }) | undefined> {
  const [url, userTwitchKey] = params as [string, UserTwitchKey]
  if (!userTwitchKey || url === null) return

  const currentCredentials = resolveCurrentCredentials(userTwitchKey)
  let response = await fetchTwitch(url, currentCredentials)

  if (response.status === 401 && currentCredentials.refresh_token) {
    try {
      const refreshedCredentials =
        await refreshStoredCredentials(currentCredentials)
      response = await fetchTwitch(url, refreshedCredentials)
    } catch (error) {
      if (
        error instanceof TwitchAuthError &&
        (error.status === 400 || error.status === 401)
      ) {
        requestTwitchReauthorization()
        throw new TwitchAuthError("Twitch authorization has expired", 401)
      }

      throw error
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      requestTwitchReauthorization()
    }

    throw new TwitchAuthError(
      `Twitch API returned status ${response.status}`,
      response.status
    )
  }

  const data = (await response.json()) as T
  return { ...data, platform: "Twitch" }
}

export const getTwitchUserId = async (
  credentials: Pick<UserTwitchKey, "access_token" | "client_id">
) => {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${credentials.access_token}`,
      "Client-Id": credentials.client_id
    }
  })

  if (!response.ok) {
    throw new TwitchAuthError(
      `Could not get Twitch user with status ${response.status}`,
      response.status
    )
  }

  const data = (await response.json()) as { data: Array<{ id: string }> }
  if (!data.data[0]) {
    throw new Error("Twitch did not return the authenticated user")
  }

  return data.data[0].id
}

export const getTwitchStreamer = async (
  credentials: UserTwitchKey,
  user_id: string
) => {
  const data = await twitchFetcher<{
    data: Array<{ profile_image_url: string }>
  }>([`https://api.twitch.tv/helix/users?id=${user_id}`, credentials])

  return data?.data[0]
}

export const kickFetcher = async (url) => {
  if (url === null) return
  const response = await fetch(url)
  let data = await response.json()
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
