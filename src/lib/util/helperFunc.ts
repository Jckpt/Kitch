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
