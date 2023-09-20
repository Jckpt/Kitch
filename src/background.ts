import { Storage } from "@plasmohq/storage"

import { type UserTwitchKey } from "~lib/types/twitchTypes"

import { twitchFetcher } from "./lib/util/fetcher"

// Set up a listener for the alarm event
chrome.alarms.onAlarm.addListener(() => {
  refresh()
})

const refresh = async () => {
  try {
    // Retrieve the user's Twitch API key from Plasmo Storage
    const storage = new Storage()
    const userTwitchKey = await storage.get<UserTwitchKey>("userTwitchKey")

    if (!userTwitchKey) console.error("No Twitch API key found in storage")
    const response = await twitchFetcher([
      `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
      userTwitchKey
    ])
    await storage.set("followedLive", response)
    if (!response.data)
      console.error("Failed to fetch Twitch data. Status:", response)

    console.log("Fetched Twitch data:", response)
  } catch (error) {
    console.error("Error fetching Twitch data:", error)
  }
  chrome.alarms.create("refresh", {
    delayInMinutes: 1.5
  })
}

refresh()
