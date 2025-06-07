import { IconLoader2 } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { searchQueryAtom, followedLiveFilterAtom } from "~src/lib/util"

import type { PlatformStream } from "../../lib/types/twitchTypes"
import StreamItem from "../StreamItem"

const FollowedTab = () => {
  const [searchQuery] = useAtom(searchQueryAtom)
  const [followedLiveFilter] = useAtom(followedLiveFilterAtom)
  const [followedLive] = useStorage({
    key: "followedLive",
    instance: new Storage({ area: "local" })
  })

  const filteredStreams = followedLive?.data?.filter((stream) => {
    const matchesSearch = stream.user_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (followedLiveFilter === "All") {
      return matchesSearch
    }
    if (followedLiveFilter === "Kick") {
      return stream.platform === "Kick" && matchesSearch
    }
    else {
      return (stream.platform === "Twitch" || stream.platform === undefined) && matchesSearch
    }
  })

  if (followedLive?.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {(filteredStreams?.length === 0 || filteredStreams === undefined) && (
        <div className="flex justify-center items-center h-full">
          <p className="text-white">No streams found</p>
        </div>
      )}
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
