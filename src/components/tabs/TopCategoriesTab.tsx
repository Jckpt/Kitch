import React from "react"

import GameItem from "../GameItem"
import InfiniteList from "../InfiniteList"

const TopCategoriesTab = ({ searchQuery }) => {
  const fetchUrl = "https://api.twitch.tv/helix/games/top"
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
