export const justWentLive = (oldChannels, newChannels) => {
  const newLiveChannels = newChannels.filter((newChannel) => {
    return !oldChannels.some((oldChannel) => oldChannel.id === newChannel.id)
  })
  return newLiveChannels
}
