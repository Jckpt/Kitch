import { ReloadIcon } from "@radix-ui/react-icons"
import React, { useEffect } from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/hook"

import { fetcher } from "~lib/util/fetcher"

import StreamItem from "./StreamItem"

const FollowStreamList = ({ searchChannel }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  console.log(userTwitchKey)
  const headerValue = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${userTwitchKey?.access_token}`,
      "Client-Id": userTwitchKey?.client_id
    }
  }
  const { data: userData } = useSWR(
    () => ["https://api.twitch.tv/helix/users", headerValue],
    fetcher
  )
  console.log(userData)
  const {
    data: liveStreams,
    isLoading,
    error
  } = useSWR(
    () => [
      `https://api.twitch.tv/helix/streams/followed?user_id=${userData.data[0].id}`,
      headerValue
    ],
    fetcher
  )
  console.log(liveStreams)
  const filteredStreams = liveStreams?.data?.filter((stream) =>
    stream.user_name.toLowerCase().includes(searchChannel.toLowerCase())
  )

  // If liveStreams is undefined or there are no matching streams, return null
  if (!liveStreams) {
    return (
      <div className="flex justify-center items-center h-full">
        <ReloadIcon className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {filteredStreams.map((stream) => (
        <StreamItem stream={stream} key={stream.id} />
      ))}
    </>
  )
}

export default FollowStreamList
