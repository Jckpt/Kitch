import React from "react"

import InfiniteList from "../InfiniteList"
import StreamItem from "../StreamItem"

const TopStreamsTab = ({ searchQuery }) => {
  const fetchUrl = "https://api.twitch.tv/helix/streams"
  return (
    <InfiniteList searchQuery={searchQuery} fetchUrl={fetchUrl}>
      {(item) => <StreamItem stream={item} key={item.id} />}
    </InfiniteList>
  )
}

export default TopStreamsTab
