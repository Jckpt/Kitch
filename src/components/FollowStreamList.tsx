import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import StreamItem from "./StreamItem"

const FollowStreamList = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")

  const { data: userData, error } = useSWR(
    () => ["https://api.twitch.tv/helix/users", userTwitchKey],
    twitchFetcher
  )
  const { data: liveStreams, isLoading } = useSWR(
    () => [
      `https://api.twitch.tv/helix/streams/followed?user_id=${userData.data[0].id}`,
      userTwitchKey
    ],
    twitchFetcher
  )
  console.log(liveStreams)
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
