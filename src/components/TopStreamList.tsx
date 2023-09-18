import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import StreamItem from "./StreamItem"

const FollowStreamList = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const {
    data: liveStreams,
    isLoading,
    error
  } = useSWR(
    () => [`https://api.twitch.tv/helix/streams`, userTwitchKey],
    twitchFetcher
  )
  console.log(`searchChannel: ${searchQuery}`)
  const filteredStreams = liveStreams?.data?.filter((stream) =>
    stream.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        Something went wrong
      </div>
    )
  }

  return (
    <>
      {filteredStreams?.map((stream) => (
        <StreamItem stream={stream} key={stream.id} />
      ))}
    </>
  )
}

export default FollowStreamList
