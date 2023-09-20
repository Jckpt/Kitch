import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import StreamItem from "./StreamItem"

const FollowStreamList = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const [followedLive] = useStorage("followedLive")
  // const {
  //   data: liveStreams,
  //   isLoading,
  //   error
  // } = useSWR(
  //   [
  //     `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
  //     userTwitchKey
  //   ],
  //   twitchFetcher
  // )
  console.log(followedLive)
  const filteredStreams = followedLive?.filter((stream) =>
    stream.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (followedLive?.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
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
