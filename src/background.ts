//@ts-ignore
import Logo from "data-url:./images/icon.png"

import { Storage } from "@plasmohq/storage"

import { type TwitchResponse, type UserTwitchKey } from "~lib/types/twitchTypes"
import {
  createNotification,
  createNotificationMultipleStreams,
  justWentLive
} from "~lib/util/helperFunc"

import { getTwitchStreamer, twitchFetcher } from "./lib/util/fetcher"

chrome.alarms.onAlarm.addListener(() => {
  refresh()
})

const refresh = async () => {
  try {
    const storage = new Storage()
    const storageLocal = new Storage({
      area: "local"
    })
    console.log("Refreshing..")
    const followedLive = await storageLocal.get<TwitchResponse>("followedLive")
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")
    const notificationsEnabled = await storage.get<boolean>(
      "notificationsEnabled"
    )
    if (!userTwitchKey) return

    const refreshedLive = await twitchFetcher([
      `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
      userTwitchKey
    ])
    await storageLocal.set("followedLive", refreshedLive)
    chrome.action.setBadgeText({ text: refreshedLive.data.length.toString() })
    chrome.action.setBadgeBackgroundColor({ color: "#737373" })
    if (!followedLive) return
    const newLiveChannels = await justWentLive(
      followedLive.data,
      refreshedLive.data
    )
    //asdasda
    if (!notificationsEnabled || followedLive.data.length <= 0) return
    if (newLiveChannels.length == 1) {
      const liveChannel = newLiveChannels[0]
      const { profile_image_url } = await getTwitchStreamer(
        userTwitchKey,
        liveChannel.user_id
      )
      console.log(profile_image_url)
      createNotification(liveChannel, profile_image_url)
    }
    if (newLiveChannels.length > 1) {
      createNotificationMultipleStreams(newLiveChannels, Logo)
    }
  } catch (error) {
    console.error("Error fetching Twitch data:", error)
  }
  chrome.alarms.create("refresh", {
    delayInMinutes: 1.5
  })
}

refresh()
