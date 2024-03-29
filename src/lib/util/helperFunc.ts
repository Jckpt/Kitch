import type { PlatformStream } from "~lib/types/twitchTypes"

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
          chrome.tabs.create({
            url: `https://www.twitch.tv/${newLiveChannel.user_name}`
          })
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
          chrome.tabs.create({
            url: `https://www.twitch.tv/directory/following/live`
          })
          chrome.notifications.clear(id)
          chrome.notifications.onClicked.removeListener(handler)
        }
      }
      chrome.notifications.onClicked.addListener(handler)
    }
  )
}

export function parseKickObject(kickObject) {
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
    thumbnail_url: livestream.thumbnail.url.replace("720", "160"),
    tag_ids: null,
    is_mature: livestream.is_mature,
    platform: "Kick"
  } as PlatformStream

  return parsedKickObject
}
