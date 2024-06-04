import { IconLoader2 } from "@tabler/icons-react"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import { twitchFetcher } from "../../lib/util/fetcher"
import StreamItem from "../StreamItem"

const TopStreamsTab = ({ searchQuery, userTwitchKey }) => {
  const fetchUrl = "https://api.twitch.tv/helix/streams"

  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)

  const getKey = (pageIndex, previousPageData) => {
    console.log(userTwitchKey)
    if (previousPageData && !previousPageData.data) return null
    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return [fetchUrl, userTwitchKey]
    console.log("made it here")
    let apiUrl = fetchUrl
    // Check if the URL already contains a question mark
    if (apiUrl.includes("?")) {
      apiUrl += `&after=${previousPageData.pagination.cursor}`
    } else {
      apiUrl += `?after=${previousPageData.pagination.cursor}`
    }
    console.log(apiUrl, userTwitchKey)
    return [apiUrl, userTwitchKey]
  }

  const {
    data: pageArray,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, twitchFetcher)
  console.log(pageArray)
  useEffect(() => {
    if (!listRef.current) return
    const list = listRef.current
    if (scrollToTop && listRef) {
      list.scrollTop = 0
      setScrollToTop(false)
    }

    const handleScroll = () => {
      if (list && list.scrollTop + list.clientHeight >= list.scrollHeight) {
        // Reached the end of the list, load more data
        console.log(isLoading, size)
        console.log(list.scrollTop, list.clientHeight, list.scrollHeight)
        if (!isLoading) {
          setSize((prevSize) => prevSize + 1)
        }
      }
    }

    list?.addEventListener("scroll", handleScroll)

    return () => {
      list?.removeEventListener("scroll", handleScroll)
    }
  }, [scrollToTop, listRef, isLoading, size])

  if (!pageArray) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div ref={listRef} className="overflow-y-auto flex flex-col h-full">
      {pageArray.map((streams, index) => {
        // `data` is an array of each page's API response.
        return streams.data.map((stream) => (
          <StreamItem stream={stream} key={stream.id} />
        ))
      })}
    </div>
  )
}

export default TopStreamsTab
