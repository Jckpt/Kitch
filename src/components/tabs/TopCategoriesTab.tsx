import { atom, useAtom } from "jotai"
import React from "react"

import StreamItem from "~components/StreamItem"

import GameItem from "../GameItem"
import InfiniteList from "../InfiniteList"

export const categoryAtom = atom("")

const TopCategoriesTab = ({ searchQuery }) => {
  const [category] = useAtom(categoryAtom)
  const fetchUrl =
    category === ""
      ? "https://api.twitch.tv/helix/games/top"
      : `https://api.twitch.tv/helix/streams?game_id=${category}`
  // TODO: jak sie kliknie to ma sie otworzyc kategoria,
  // wymyslilem jak to zrobic: dodac jakis state managment i jezeli game_id jest ustawione to
  // wtedy renderowac kategorie, a jak nie to renderowac liste gier
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
