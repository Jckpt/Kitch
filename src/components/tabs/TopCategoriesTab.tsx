import { atom, useAtom } from "jotai"
import React from "react"

import StreamItem from "~components/StreamItem"

import GameItem from "../GameItem"
import InfiniteList from "../InfiniteList"

export const categoryAtom = atom("")

const TopCategoriesTab = ({ searchQuery }) => {
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  const [category] = useAtom(categoryAtom)
  const fetchUrl =
    category === ""
      ? "https://api.twitch.tv/helix/games/top"
      : `https://api.twitch.tv/helix/streams?game_id=${category}`
  return (
    <InfiniteList
      searchQuery={searchQuery}
      fetchUrl={fetchUrl}
      className={`${category === "" && "grid grid-cols-4"}`}>
      {(item) =>
        category === "" ? (
          <GameItem game={item} key={item.id} />
        ) : (
          <StreamItem stream={item} key={item.id} />
        )
      }
    </InfiniteList>
  )
}

export default TopCategoriesTab
