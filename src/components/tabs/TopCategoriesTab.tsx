import React from "react"

import GameItem from "../GameItem"
import InfiniteList from "../InfiniteList"

const TopCategoriesTab = ({ searchQuery }) => {
  const fetchUrl = "https://api.twitch.tv/helix/games/top"
  // TODO: jak sie kliknie to ma sie otworzyc kategoria,
  // wymyslilem jak to zrobic: dodac jakis state managment i jezeli game_id jest ustawione to
  // wtedy renderowac kategorie, a jak nie to renderowac liste gier
  return (
    <InfiniteList
      searchQuery={searchQuery}
      fetchUrl={fetchUrl}
      className="grid grid-cols-4">
      {(item) => <GameItem game={item} key={item.id} />}
    </InfiniteList>
  )
}

export default TopCategoriesTab
