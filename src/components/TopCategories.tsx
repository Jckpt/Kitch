import { IconLoader2 } from "@tabler/icons-react"
import React from "react"
import useSWR from "swr"

import { useStorage } from "@plasmohq/storage/hook"

import { twitchFetcher } from "~lib/util/fetcher"

import GameItem from "./GameItem"
import StreamItem from "./StreamItem"

const TopCategories = ({ searchQuery }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const {
    data: games,
    isLoading,
    error
  } = useSWR(
    () => [
      searchQuery === ""
        ? `https://api.twitch.tv/helix/games/top`
        : `https://api.twitch.tv/helix/games?name=${searchQuery}`,
      userTwitchKey
    ],
    twitchFetcher
  )
  console.log(games)

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
    <>{games?.data?.map((game) => <GameItem game={game} key={game.id} />)}</>
  )
}

export default TopCategories
