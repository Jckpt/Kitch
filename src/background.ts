//@ts-ignore
import Logo from "data-url:./images/icon.png"

import { Storage } from "@plasmohq/storage"

import {
  type PlatformResponse,
  type PlatformStream,
  type UserTwitchKey
} from "./lib/types/twitchTypes"
import { API_URL, WS_URL } from "./lib/util/config"
import {
  getTwitchOAuthURL,
  getTwitchStreamer,
  getTwitchUserId,
  twitchFetcher
} from "./lib/util/fetcher"
import {
  createNotification,
  createNotificationMultipleStreams,
  justWentLive,
  parseKickObject,
  parseKickChannelFromWebSocket
} from "./lib/util/helperFunc"
import { KickWebSocketManager } from "./lib/util/kickWebSocket"

chrome.alarms.onAlarm.addListener(() => {
  refresh()
})

const storage = new Storage()
const storageLocal = new Storage({
  area: "local"
})

// Inicjalizacja WebSocket managera dla Kick
const kickWsManager = new KickWebSocketManager(WS_URL)

storage.watch({
  userTwitchKey: (c) => {
    if (c.newValue !== undefined) refresh()
  },
  kickFollows: async (c) => {
    // Reconnect WebSocket przy zmianie listy followów
    if (c.newValue !== undefined) {
      await connectKickWebSocket()
    }
  }
})

chrome.runtime.onStartup.addListener(async () => {
  await storageLocal.remove("followedLive")

  refresh()
  await connectKickWebSocket()
})

chrome.runtime.onInstalled.addListener(async (details) => {
  await storageLocal.remove("followedLive")

  if (details.reason === "install") {
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")
    const kickFollows = await storage.get<string[]>("kickFollows")
    const isNewUser = await storage.get<boolean>("isNewUser")

    if (isNewUser === undefined && !userTwitchKey && (!kickFollows || kickFollows.length === 0)) {
      await storage.set("isNewUser", true)
    } else if (isNewUser === undefined) {
      await storage.set("isNewUser", false)
    }
  }

  refresh()
  await connectKickWebSocket()
})

// WebSocket connection management for Kick
async function connectKickWebSocket() {
  try {
    const kickFollows = await storage.get<string[]>("kickFollows")

    // Disconnect existing connection
    kickWsManager.disconnect()

    if (!kickFollows || kickFollows.length === 0) {
      console.log("No Kick follows, skipping WebSocket connection")
      await storageLocal.set("kickLiveStreams", [])
      return
    }

    console.log(`Connecting Kick WebSocket with ${kickFollows.length} streamers`)

    // Clear previous callbacks
    kickWsManager.clearCallbacks()

    // Setup message handler
    kickWsManager.onMessage(handleKickWebSocketMessage)

    // Setup error handler
    kickWsManager.onError((error) => {
      console.error("Kick WebSocket error:", error)
    })

    // Setup reconnect handler
    kickWsManager.onReconnect(() => {
      console.log("Kick WebSocket reconnected")
    })

    // Connect with list of streamers
    kickWsManager.connect(kickFollows)
  } catch (error) {
    console.error("Error connecting Kick WebSocket:", error)
  }
}

// Handle WebSocket messages from Kick
async function handleKickWebSocketMessage(message: any) {
  try {
    const followedLive = await storageLocal.get<PlatformResponse<PlatformStream>>("followedLive") || {
      data: [],
      pagination: { cursor: null },
      platform: "twitch"
    }

    const kickLiveStreams = await storageLocal.get<PlatformStream[]>("kickLiveStreams") || []
    const notificationsEnabled = await storage.get<boolean>("notificationsEnabled")
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")

    if (message.type === "stream_live") {
      const kickChannel = message.data
      console.log(`Stream live: ${kickChannel.slug}`)

      // Convert KickChannel to PlatformStream format (using WebSocket-specific parser)
      const kickStream = parseKickChannelFromWebSocket(kickChannel, kickChannel.slug)

      // Check if streamer already exists in kickLiveStreams
      const existingIndex = kickLiveStreams.findIndex(
        (s) => s.user_login?.toLowerCase() === kickChannel.slug.toLowerCase()
      )

      const oldKickLiveStreams = [...kickLiveStreams]

      if (existingIndex >= 0) {
        // Update existing stream
        kickLiveStreams[existingIndex] = kickStream
      } else {
        // Add new stream
        kickLiveStreams.push(kickStream)
      }

      // Save updated Kick streams
      await storageLocal.set("kickLiveStreams", kickLiveStreams)

      // Update followedLive with all streams (Twitch + Kick)
      // Filter out any undefined/null values to prevent errors
      const twitchStreams = followedLive.data.filter(s => s && s.platform !== "Kick")
      const validKickStreams = kickLiveStreams.filter(s => s && s.user_login)
      const allStreams = [...twitchStreams, ...validKickStreams]
      allStreams.sort((a, b) => b.viewer_count - a.viewer_count)

      const updatedFollowedLive = {
        ...followedLive,
        data: allStreams
      }

      await storageLocal.set("followedLive", updatedFollowedLive)
      chrome.action.setBadgeText({ text: allStreams.length.toString() })
      chrome.action.setBadgeBackgroundColor({ color: "#737373" })

      // Check for new live notification (only if wasn't previously live)
      if (existingIndex < 0 && notificationsEnabled) {
        const newLiveChannels = await justWentLive(
          oldKickLiveStreams,
          kickLiveStreams
        )

        if (newLiveChannels.length > 0) {
          createNotification(newLiveChannels[0], Logo)
        }
      }

    } else if (message.type === "stream_offline") {
      const slug = message.data.slug
      console.log(`Stream offline: ${slug}`)

      // Remove from kickLiveStreams
      const updatedKickStreams = kickLiveStreams.filter(
        (s) => s && s.user_login && s.user_login.toLowerCase() !== slug.toLowerCase()
      )

      await storageLocal.set("kickLiveStreams", updatedKickStreams)

      // Update followedLive
      const twitchStreams = followedLive.data.filter(s => s && s.platform !== "Kick")
      const validKickStreams = updatedKickStreams.filter(s => s && s.user_login)
      const allStreams = [...twitchStreams, ...validKickStreams]
      allStreams.sort((a, b) => b.viewer_count - a.viewer_count)

      const updatedFollowedLive = {
        ...followedLive,
        data: allStreams
      }

      await storageLocal.set("followedLive", updatedFollowedLive)
      chrome.action.setBadgeText({ text: allStreams.length.toString() })
      chrome.action.setBadgeBackgroundColor({ color: "#737373" })
    }
  } catch (error) {
    console.error("Error handling Kick WebSocket message:", error)
  }
}

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
      refreshedLive = (await twitchFetcher([
        `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
        userTwitchKey
      ])) as PlatformResponse<PlatformStream>
    }

    // Kick streams are now managed via WebSocket
    // Get current Kick live streams from storage
    const kickLiveStreams = await storageLocal.get<PlatformStream[]>("kickLiveStreams") || []

    // Filter out any undefined/null values to prevent errors
    const validKickStreams = kickLiveStreams.filter(s => s && s.user_login)

    refreshedLive.data = [...refreshedLive.data, ...validKickStreams]
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
    if (error.status === 401 || error.message.includes("not iterable")) {
      const storage = new Storage()
      storage.remove("userTwitchKey")
      storage.remove("followedLive")
    }
  }
}

// Nasłuchiwanie na aktualizacje zakładek
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith("https://kitch.pl/")
  ) {
    try {
      await authorize(tab.url)
      // Zamknij zakładkę po autoryzacji
    } catch (e) {
      console.error("Błąd podczas autoryzacji:", e)
      await storage.set("authLoading", false)
    }
  }
})

// on message do authorization
chrome.runtime.onMessage.addListener(async (request) => {
  if (request.type === "authorize") {
    try {
      await storage.set("authLoading", true)
      const authUrl = getTwitchOAuthURL()
      // Otwórz nową zakładkę z URL autoryzacji
      chrome.tabs.create({ url: authUrl })
    } catch (e) {
      console.error("Błąd podczas autoryzacji:", e)
      await storage.set("authLoading", false)
    }
  } else if (request.type === "refresh") {
    // Reconnect Kick WebSocket to refresh followed streamers
    await connectKickWebSocket()
    // Refresh Twitch data
    refresh()
  } else if (request.type === "logout") {
    const storage = new Storage()
    await storage.remove("userTwitchKey")
    await storage.remove("followedLive")
    await storage.remove("authLoading")
    refresh()
  } else if (request.type === "KICK_FOLLOWS_CHANGED") {
    console.log("Kick follows changed, reconnecting WebSocket...")
    await connectKickWebSocket()
  }
})

async function authorize(redirectUrl) {
  try {
    const urlObject = new URL(redirectUrl)
    const fragment = urlObject.hash.substring(1)
    const accessToken = new URLSearchParams(fragment).get("access_token")

    if (!accessToken) {
      throw new Error("Nie udało się uzyskać tokena dostępu")
    }

    const clientId = "256lknox4x75bj30rwpctxna2ckbmn"
    const userCredentials = {
      user_id: await getTwitchUserId({
        access_token: accessToken,
        client_id: clientId
      }),
      access_token: accessToken,
      client_id: clientId
    }

    const storage = new Storage()
    await storage.set("userTwitchKey", userCredentials)
    await storage.set("authLoading", false)

    // Wyłącz flagę nowego użytkownika po pierwszym zalogowaniu
    await storage.set("isNewUser", false)
  } catch (e) {
    console.error("Błąd autoryzacji:", e)
    const storage = new Storage()
    await storage.set("authLoading", false)
  }
}
