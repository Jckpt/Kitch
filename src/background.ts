//@ts-ignore
import Logo from "data-url:./images/icon.png"

import { Storage } from "@plasmohq/storage"

import { type TwitchResponse, type UserTwitchKey } from "~lib/types/twitchTypes"
import { justWentLive } from "~lib/util/helperFunc"

import {
  getTwitchStreamer,
  getTwitchUser,
  twitchFetcher
} from "./lib/util/fetcher"

// Set up a listener for the alarm event
chrome.alarms.onAlarm.addListener(() => {
  refresh()
})

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: "https://twitch.tv/forsen" })
})

const refresh = async () => {
  try {
    const storage = new Storage()

    const storageLive = await storage.get<TwitchResponse>("followedLive")
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")
    const notificationsEnabled = await storage.get<boolean>(
      "notificationsEnabled"
    )

    if (!userTwitchKey) console.error("No Twitch API key found in storage")

    const refreshedLive = await twitchFetcher([
      `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
      userTwitchKey
    ])
    const newLiveChannels = await justWentLive(
      storageLive.data,
      refreshedLive.data
    )

    chrome.action.setBadgeText({ text: refreshedLive.data.length.toString() })
    chrome.action.setBadgeBackgroundColor({ color: "#737373" })

    await storage.set("followedLive", refreshedLive)

    if (!notificationsEnabled || storageLive.data.length <= 0) return
    if (newLiveChannels.length == 1) {
      console.log(newLiveChannels[0])
      const channel = await getTwitchStreamer(
        userTwitchKey,
        newLiveChannels[0].user_id
      )
      console.log(channel)
      chrome.notifications.create("liveNotification", {
        title: `${newLiveChannels[0].user_name} is now live!`,
        message: `${newLiveChannels[0].title}`,
        iconUrl: channel.profile_image_url,
        type: "basic"
      })
    } else if (newLiveChannels.length > 1) {
      chrome.notifications.create("liveNotification", {
        title: `${newLiveChannels.length} channels are now live!`,
        message: `${newLiveChannels
          .map((channel) => channel.user_name)
          .join(", ")} are now live!`,
        iconUrl: Logo,
        type: "basic"
      })
    }
  } catch (error) {
    console.error("Error fetching Twitch data:", error)
  }
  chrome.alarms.create("refresh", {
    delayInMinutes: 1.5
  })
}

refresh()
