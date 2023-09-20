import { IconLoader2 } from "@tabler/icons-react"
import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import StreamItem from "./StreamItem"

const FollowStreamList = ({ searchQuery }) => {
  const [followedLive] = useStorage("followedLive")

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
    </>
  )
}

export default FollowStreamList
