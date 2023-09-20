import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import useSWRInfinite from "swr/infinite"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import StreamItem from "./StreamItem"

const FollowStreamList = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const getKey = (pageIndex, previousPageData) => {
    // reached the end
    if (previousPageData && !previousPageData.data) return null

    // first page, we don't have `previousPageData`
    if (pageIndex === 0)
      return [`https://api.twitch.tv/helix/streams`, userTwitchKey]

    // add the cursor to the API endpoint
    return [
      `https://api.twitch.tv/helix/streams?after=${previousPageData.pagination.cursor}`,
      userTwitchKey
    ]
  }
  const {
    data: liveStreamsArray,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, twitchFetcher)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {liveStreamsArray.map((liveStreams) => {
        // `data` is an array of each page's API response.
        return liveStreams?.data?.map((stream) => (
          <StreamItem stream={stream} key={stream.id} />
        ))
      })}
      <button onClick={() => setSize(size + 1)}>
        {isLoading ? "Loading..." : "Load more"}
      </button>
    </>
  )
}

export default FollowStreamList
