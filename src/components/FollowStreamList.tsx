import { IconLoader2 } from "@tabler/icons-react"
import React, { useEffect } from "react"
import useSWRMutation from "swr/mutation"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import StreamItem from "./StreamItem"
import { Button } from "./ui/button"

const FollowStreamList = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const [followedLive, setFollowedLive] = useStorage("followedLive")
  const { data: refreshedStreams, trigger } = useSWRMutation(
    [
      `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchKey?.user_id}`,
      userTwitchKey
    ],
    twitchFetcher
  )

  useEffect(() => {
    if (!refreshedStreams) return
    setFollowedLive(refreshedStreams.data)
  }, [refreshedStreams])

  // const filteredStreams = followedLive?.filter((stream) =>
  //   stream.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  // )

  if (followedLive?.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {followedLive?.data?.map((stream) => (
        <StreamItem stream={stream} key={stream.id} />
      ))}
      <Button onClick={trigger}>refresh</Button>
    </>
  )
}

export default FollowStreamList
