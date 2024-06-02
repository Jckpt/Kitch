//@ts-ignore
import Logo from "data-url:./images/icon.png"

import { Storage } from "@plasmohq/storage"

import {
  type PlatformResponse,
  type PlatformStream,
  type UserTwitchKey
} from "~lib/types/twitchTypes"
import {
  createNotification,
  createNotificationMultipleStreams,
  justWentLive,
  parseKickObject
} from "~lib/util/helperFunc"

import {
  getTwitchOAuthURL,
  getTwitchStreamer,
  getTwitchUserId,
  twitchFetcher
} from "./lib/util/fetcher"

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
  console.log("Starting up..")
  const storageLocal = new Storage({
    area: "local"
  })
  storageLocal.remove("followedLive")

  refresh()
})

chrome.runtime.onInstalled.addListener(() => {
  console.log("Installed")
  const storageLocal = new Storage({
    area: "local"
  })
  storageLocal.remove("followedLive")

  refresh()
})

const refresh = async () => {
  console.log("Refreshing..")
  try {
    const followedLive =
      await storageLocal.get<PlatformResponse<PlatformStream>>("followedLive")
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")
    const kickFollows = await storage.get<string[]>("kickFollows")
    const notificationsEnabled = await storage.get<boolean>(
      "notificationsEnabled"
    )

    if (!userTwitchKey) {
      console.log("No userTwitchKey")
      return
    }

    let refreshedLive = (await twitchFetcher([
      `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
      userTwitchKey
    ])) as PlatformResponse<PlatformStream>

    let kickLivestreams = []
    if (kickFollows && kickFollows.length > 0) {
      try {
        const streamersQuery = kickFollows.join(",")
        const kickStreamsResponse = await fetch(
          `https://kitch.pl/api/channels?streamers=${streamersQuery}`
        )
        const kickStreamsJson = await kickStreamsResponse.json()

        for (const streamer of kickFollows) {
          const kickStreamJson = kickStreamsJson[streamer]

          if (kickStreamJson.error || kickStreamJson.livestream === null)
            continue

          kickLivestreams.push(parseKickObject(kickStreamJson))
        }
      } catch (error) {
        console.error("Error fetching kick streams:", error)
      }
    }
    console.log("kickLivestreams", kickLivestreams)

    console.log("refreshedLive", refreshedLive)
    refreshedLive.data = [...refreshedLive.data, ...kickLivestreams]
    // sort by viewer count
    refreshedLive.data.sort((a, b) => b.viewer_count - a.viewer_count)

    await storageLocal.set("followedLive", refreshedLive)
    chrome.action.setBadgeText({ text: refreshedLive.data.length.toString() })
    chrome.action.setBadgeBackgroundColor({ color: "#737373" })
    if (!followedLive) {
      console.log("No followedLive")
      return
    }

    const newLiveChannels = await justWentLive(
      followedLive.data,
      refreshedLive.data
    )

    if (!notificationsEnabled || newLiveChannels.length <= 0) {
      console.log("Notifications disabled or no followed channels")
      return
    }
    if (newLiveChannels.length == 1) {
      const liveChannel = newLiveChannels[0]
      const { profile_image_url } = await getTwitchStreamer(
        userTwitchKey,
        liveChannel.user_id
      )

      createNotification(liveChannel, profile_image_url)
    }
    if (newLiveChannels.length > 1) {
      createNotificationMultipleStreams(newLiveChannels, Logo)
    }
  } catch (error) {
    console.error("Error fetching Twitch data:", error)
    if (error.status === 401) {
      const storage = new Storage()
      storage.remove("userTwitchKey")
    }
  } finally {
    console.log("refresh alarm created")
    chrome.alarms.create("refresh", {
      delayInMinutes: 1.5
    })
  }
}

// on message do authorization
chrome.runtime.onMessage.addListener(async (request) => {
  console.log("got message", request)
  if (request.type === "authorize") {
    try {
      await storage.set("authLoading", true)
      await chrome.identity.launchWebAuthFlow(
        {
          interactive: true,
          url: getTwitchOAuthURL()
        },
        (redirectUrl) => {
          authorize(redirectUrl)
        }
      )
    } catch (e) {
      console.error(e)
    }
  } else if (request.type === "refresh") {
    refresh()
  }
})

async function authorize(redirectUrl) {
  const urlObject = new URL(redirectUrl)
  const fragment = urlObject.hash.substring(1) // Pomiń znak '#'
  const accessToken = new URLSearchParams(fragment).get("access_token")

  const clientId = "256lknox4x75bj30rwpctxna2ckbmn"
  const userCredentials = {
    user_id: await getTwitchUserId({
      access_token: accessToken,
      client_id: clientId
    }),
    access_token: accessToken,
    client_id: clientId
  }
  console.log(userCredentials)

  const storage = new Storage()
  await storage.set("userTwitchKey", userCredentials)
  await storage.set("authLoading", false)
}
