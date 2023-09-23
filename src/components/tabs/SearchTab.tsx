import React from "react"

import InfiniteList from "~components/InfiniteList"

import UserItem from "../UserItem"

const SearchTab = ({ searchQuery }) => {
  const fetchUrl = `https://api.twitch.tv/helix/search/channels?query=${searchQuery}`

  if (searchQuery === "") {
    return (
      <div className="flex justify-center items-center text-sm grow h-full">
        Search for a channel
      </div>
    )
  }

  return (
    <InfiniteList searchQuery={searchQuery} fetchUrl={fetchUrl}>
      {(item) => <UserItem user={item} key={item.id} />}
    </InfiniteList>
  )
}

export default SearchTab
