import { IconLoader2, IconGhost3, IconSettings } from "@tabler/icons-react"
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
  const [isNewUser] = useStorage<boolean>("isNewUser")
  const [userTwitchKey] = useStorage("userTwitchKey")
  const [kickFollows] = useStorage<string[]>("kickFollows")

  const filteredStreams = followedLive?.data?.filter((stream) => {
    // Defensive check for undefined values
    if (!stream || !stream.user_name) {
      return false
    }
    
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

  const isNewUserWithNoData = isNewUser === true && !userTwitchKey && (!kickFollows || kickFollows.length === 0)

  return (
    <>
      {(filteredStreams?.length === 0 || filteredStreams === undefined) && (
        <div className="flex flex-col justify-center items-center h-full gap-3">
          {isNewUserWithNoData ? (
            <>
              <IconSettings className="h-12 w-12 text-gray-400" />
              <p className="text-white text-center text-gray-400">Complete setup</p>
            </>
          ) : (
            <>
              <IconGhost3 className="h-12 w-12 text-gray-400" />
              <p className="text-white text-center text-gray-400">No streams found</p>
            </>
          )}
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
