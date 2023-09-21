import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import UserItem from "./UserItem"

const SearchTab = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const {
    data: users,
    isLoading,
    error
  } = useSWR(
    () => [
      searchQuery === ""
        ? null
        : `https://api.twitch.tv/helix/search/channels?query=${searchQuery}`,
      userTwitchKey
    ],
    twitchFetcher
  )
  // const filteredStreams = followedLive?.filter((stream) =>
  //   stream.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  // )

  if (searchQuery === "") {
    return (
      <div className="flex justify-center items-center grow h-full">
        Search for a channel
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>{users?.data.map((user) => <UserItem user={user} key={user.id} />)}</>
  )
}

export default SearchTab
