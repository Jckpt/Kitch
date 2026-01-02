import { reduce } from "lodash-es"

import type { PlatformStream } from "../types/twitchTypes"

export const justWentLive = (oldChannels, newChannels) => {
  const newLiveChannels = newChannels.filter((newChannel) => {
    return !oldChannels.some((oldChannel) => oldChannel.id === newChannel.id)
  })
  return newLiveChannels
}

export function createNotification(newLiveChannel, iconUrl) {
  chrome.notifications.create(
    "notification",
    {
      title: `${newLiveChannel.user_name} is now live!`,
      message: `${newLiveChannel.title}`,
      iconUrl,
      type: "basic"
    },
    function (createdId) {
      const handler = (id) => {
        if (id == createdId) {
          if (newLiveChannel.platform === "Kick") {
            chrome.tabs.create({
              url: `https://kick.com/${newLiveChannel.user_name}`
            })
          } else {
            chrome.tabs.create({
              url: `https://www.twitch.tv/${newLiveChannel.user_name}`
            })
          }
          chrome.notifications.clear(id)
          chrome.notifications.onClicked.removeListener(handler)
        }
      }
      chrome.notifications.onClicked.addListener(handler)
    }
  )
}

export function createNotificationMultipleStreams(newLiveChannels, iconUrl) {
  chrome.notifications.create(
    "notification",
    {
      title: `${newLiveChannels.length} channels are now live!`,
      message: `${newLiveChannels
        .map((channel) => channel.user_name)
        .join(", ")} are now live!`,
      iconUrl,
      type: "basic"
    },
    function (createdId) {
      const handler = (id) => {
        if (id == createdId) {
          chrome.notifications.clear(id)
          chrome.notifications.onClicked.removeListener(handler)
        }
      }
      chrome.notifications.onClicked.addListener(handler)
    }
  )
}

export const transformKickData = (kickData) => {
  return {
    data: kickData.data.map((stream) => ({
      user_login: stream.slug,
      user_name: stream.slug,
      viewer_count: stream.viewer_count,
      title: stream.stream_title,
      game_name: stream.category?.name || "",
      thumbnail_url: stream.thumbnail,
      started_at: stream.started_at
    }))
  }
}

export function parseKickObject(kickObject, streamer) {
  const { id, user_id, slug, user, livestream } = kickObject

  const parsedKickObject = {
    id,
    user_id,
    user_login: slug,
    user_name: streamer,
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

// Parse KickChannel from WebSocket (different structure than old API)
export function parseKickChannelFromWebSocket(kickChannel, streamer) {
  const parsedKickObject = {
    id: kickChannel.broadcaster_user_id || "",
    user_id: kickChannel.broadcaster_user_id || "",
    user_login: kickChannel.slug || "",
    user_name: streamer || kickChannel.slug || "",
    game_id: kickChannel.category?.id?.toString() || "",
    game_name: kickChannel.category?.name || "",
    type: "live",
    title: kickChannel.stream_title || "",
    tags: [],
    viewer_count: kickChannel.stream?.viewer_count || 0,
    started_at: kickChannel.stream?.start_time || new Date().toISOString(),
    language: kickChannel.stream?.language || "en",
    thumbnail_url: kickChannel.stream?.thumbnail || "",
    tag_ids: [],
    is_mature: kickChannel.stream?.is_mature || false,
    platform: "Kick"
  } as PlatformStream

  return parsedKickObject
}

export function sendRuntimeMessage(type: string, ...args: any[]): Promise<any> {
  return chrome.runtime.sendMessage({ type, args })
}

export function categoryUrl(category, searchQuery) {
  if (category !== "") {
    return `https://api.twitch.tv/helix/streams?game_id=${category}`
  }
  if (category === "" && searchQuery === "") {
    return "https://api.twitch.tv/helix/games/top"
  }
  if (category === "" && searchQuery !== "") {
    return `https://api.twitch.tv/helix/search/categories?query=${searchQuery}`
  }
}

export function template(input: string, data) {
  return reduce(
    data,
    (result, value, key) => result.replace(key, String(value)),
    input
  )
}
