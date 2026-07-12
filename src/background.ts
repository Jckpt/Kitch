//@ts-ignore
import Logo from "data-url:./images/icon.png"

import { Storage } from "@plasmohq/storage"

import {
  type PlatformResponse,
  type PlatformStream,
  type UserTwitchKey
} from "./lib/types/twitchTypes"
import {
  getTwitchStreamer,
  getTwitchUserId,
  twitchFetcher
} from "./lib/util/fetcher"
import {
  createNotification,
  createNotificationMultipleStreams,
  justWentLive,
  parseKickObject
} from "./lib/util/helperFunc"
import { kickApiUrl } from "./lib/util/kickApi"
import {
  createTwitchOAuthState,
  exchangeTwitchAuthorizationCode,
  getTwitchOAuthURL,
  TWITCH_CLIENT_ID,
  TWITCH_REDIRECT_URI,
  TwitchAuthError
} from "./lib/util/twitchAuth"

let twitchAuthorizationInProgress = false
let twitchAuthorizationTabId: number | null = null

chrome.alarms.onAlarm.addListener(() => {
  refresh()
})

const storage = new Storage()
const storageLocal = new Storage({
  area: "local"
})

storage.watch({
  userTwitchKey: (c) => {
    if (c.newValue !== undefined) refresh()
  }
})

chrome.runtime.onStartup.addListener(() => {
  storageLocal.remove("followedLive")

  refresh()
})

chrome.runtime.onInstalled.addListener(async (details) => {
  storageLocal.remove("followedLive")

  if (details.reason === "install") {
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")
    const kickFollows = await storage.get<string[]>("kickFollows")
    const isNewUser = await storage.get<boolean>("isNewUser")

    if (
      isNewUser === undefined &&
      !userTwitchKey &&
      (!kickFollows || kickFollows.length === 0)
    ) {
      await storage.set("isNewUser", true)
    } else if (isNewUser === undefined) {
      await storage.set("isNewUser", false)
    }
  }

  refresh()
})

const refresh = async () => {
  try {
    console.log("refresh alarm created")
    chrome.alarms.create("refresh", {
      delayInMinutes: 4
    })
    const followedLive =
      await storageLocal.get<PlatformResponse<PlatformStream>>("followedLive")
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")
    const kickFollows = await storage.get<string[]>("kickFollows")
    const notificationsEnabled = await storage.get<boolean>(
      "notificationsEnabled"
    )

    if (!userTwitchKey && kickFollows?.length === 0) {
      console.log("No userTwitchKey or kickFollows found")
      return
    }

    let refreshedLive: PlatformResponse<PlatformStream> = {
      data: [],
      pagination: {
        cursor: null
      },
      platform: "twitch"
    }
    if (userTwitchKey) {
      refreshedLive = await twitchFetcher<PlatformResponse<PlatformStream>>([
        `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
        userTwitchKey
      ])
    }

    let kickLivestreams = []
    if (kickFollows && kickFollows.length > 0) {
      try {
        const streamersQuery = kickFollows.join(",")
        const kickStreamsResponse = await fetch(
          kickApiUrl(`/api/v2/channels?streamers=${streamersQuery}`)
        )
        const kickStreamsJson = await kickStreamsResponse.json()

        for (const streamer of kickFollows) {
          const kickStreamJson = kickStreamsJson[streamer.toLowerCase()]
          if (kickStreamJson.error || kickStreamJson.livestream === null)
            continue

          kickLivestreams.push(parseKickObject(kickStreamJson, streamer))
        }
      } catch (error) {
        console.error("Error fetching kick streams:", error)
      }
    }

    refreshedLive.data = [...refreshedLive.data, ...kickLivestreams]
    // sort by viewer count
    refreshedLive.data.sort((a, b) => b.viewer_count - a.viewer_count)

    await storageLocal.set("followedLive", refreshedLive)
    chrome.action.setBadgeText({ text: refreshedLive.data.length.toString() })
    chrome.action.setBadgeBackgroundColor({ color: "#737373" })
    if (!followedLive) {
      return
    }

    const newLiveChannels = await justWentLive(
      followedLive.data,
      refreshedLive.data
    )

    if (!notificationsEnabled || newLiveChannels.length <= 0) {
      return
    }
    if (newLiveChannels.length == 1) {
      const liveChannel = newLiveChannels[0]

      if (liveChannel?.platform === "Kick") {
        createNotification(liveChannel, Logo)
      } else {
        const { profile_image_url } = await getTwitchStreamer(
          userTwitchKey,
          liveChannel.user_id
        )
        createNotification(liveChannel, profile_image_url)
      }
    }
    if (newLiveChannels.length > 1) {
      createNotificationMultipleStreams(newLiveChannels, Logo)
    }
  } catch (error) {
    console.error("Error fetching Twitch data:", error)
    if (error instanceof TwitchAuthError && error.status === 401) {
      await startTwitchAuthorization()
    }
  }
}

// Nasłuchiwanie na aktualizacje zakładek
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isOAuthResponse = (() => {
    if (!tab.url?.startsWith(TWITCH_REDIRECT_URI)) return false

    const url = new URL(tab.url)
    return url.searchParams.has("code") || url.searchParams.has("error")
  })()

  if (changeInfo.status === "complete" && tab.url && isOAuthResponse) {
    try {
      await authorize(tab.url)
      await chrome.tabs.remove(tabId)
    } catch (e) {
      console.error("Błąd podczas autoryzacji:", e)
      await storage.set("authLoading", false)
      await chrome.tabs.remove(tabId)
    }
  }
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const storedTabId = await storage.get<number>("twitchOAuthTabId")
  if (tabId !== twitchAuthorizationTabId && tabId !== storedTabId) return

  twitchAuthorizationTabId = null
  twitchAuthorizationInProgress = false
  await storage.set("authLoading", false)
  await storage.remove("twitchOAuthState")
  await storage.remove("twitchOAuthTabId")
})

// on message do authorization
chrome.runtime.onMessage.addListener(async (request) => {
  if (request.type === "authorize") {
    try {
      await startTwitchAuthorization()
    } catch (e) {
      console.error("Błąd podczas autoryzacji:", e)
      await storage.set("authLoading", false)
    }
  } else if (request.type === "twitch-auth-required") {
    await startTwitchAuthorization()
  } else if (request.type === "refresh") {
    refresh()
  } else if (request.type === "logout") {
    const storage = new Storage()
    await storage.remove("userTwitchKey")
    await storage.remove("twitchOAuthState")
    await storage.remove("twitchOAuthTabId")
    await storage.remove("followedLive")
    await storage.remove("authLoading")
    refresh()
  }
})

async function startTwitchAuthorization() {
  if (twitchAuthorizationInProgress) return

  const storedTabId = await storage.get<number>("twitchOAuthTabId")
  if (storedTabId !== undefined) {
    try {
      await chrome.tabs.get(storedTabId)
      twitchAuthorizationInProgress = true
      twitchAuthorizationTabId = storedTabId
      return
    } catch {
      await storage.remove("twitchOAuthTabId")
    }
  }

  twitchAuthorizationInProgress = true
  const state = createTwitchOAuthState()
  try {
    await storage.set("authLoading", true)
    await storage.set("twitchOAuthState", state)
    const tab = await chrome.tabs.create({ url: getTwitchOAuthURL(state) })
    twitchAuthorizationTabId = tab.id ?? null
    if (tab.id !== undefined) {
      await storage.set("twitchOAuthTabId", tab.id)
    }
  } catch (error) {
    twitchAuthorizationInProgress = false
    await storage.set("authLoading", false)
    await storage.remove("twitchOAuthState")
    await storage.remove("twitchOAuthTabId")
    throw error
  }
}

async function authorize(redirectUrl: string) {
  try {
    const urlObject = new URL(redirectUrl)
    const authorizationCode = urlObject.searchParams.get("code")
    const oauthError = urlObject.searchParams.get("error")

    if (oauthError) {
      throw new Error(`Twitch authorization failed: ${oauthError}`)
    }

    if (!authorizationCode) {
      throw new Error("Nie udało się uzyskać kodu autoryzacji Twitch")
    }

    const expectedState = await storage.get<string>("twitchOAuthState")
    const returnedState = urlObject.searchParams.get("state")

    if (!expectedState || returnedState !== expectedState) {
      throw new Error("Nieprawidłowy stan autoryzacji Twitch")
    }

    const token = await exchangeTwitchAuthorizationCode(authorizationCode)

    const userCredentials: UserTwitchKey = {
      user_id: await getTwitchUserId({
        access_token: token.access_token,
        client_id: TWITCH_CLIENT_ID
      }),
      access_token: token.access_token,
      client_id: TWITCH_CLIENT_ID,
      refresh_token: token.refresh_token,
      auth_version: 2
    }

    await storage.set("userTwitchKey", userCredentials)
    await storage.set("authLoading", false)
    await storage.remove("twitchOAuthState")
    await storage.remove("twitchOAuthTabId")

    // Wyłącz flagę nowego użytkownika po pierwszym zalogowaniu
    await storage.set("isNewUser", false)
  } catch (e) {
    console.error("Błąd autoryzacji:", e)
    await storage.set("authLoading", false)
    await storage.remove("twitchOAuthState")
    throw e
  } finally {
    twitchAuthorizationInProgress = false
  }
}
