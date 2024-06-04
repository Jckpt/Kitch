import { IconLoader2 } from "@tabler/icons-react"
import React from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import type { PlatformStream } from "../../lib/types/twitchTypes"
import StreamItem from "../StreamItem"

const FollowedTab = ({ searchQuery }) => {
  const [followedLive] = useStorage({
    key: "followedLive",
    instance: new Storage({ area: "local" })
  })

  const filteredStreams = followedLive?.data?.filter((stream) =>
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
      {filteredStreams?.map((stream: PlatformStream) =>
        stream?.platform === "Kick" ? (
          <StreamItem variant="Kick" stream={stream} key={stream.id} />
        ) : (
          <StreamItem stream={stream} key={stream.id} />
        )
      )}
    </>
  )
}

export default FollowedTab
