import { IconLoader2 } from "@tabler/icons-react"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import { twitchFetcher } from "../lib/util/fetcher"
import StreamItem from "./StreamItem"

const TwitchStreams = ({ userTwitchKey }) => {
  const fetchUrl = "https://api.twitch.tv/helix/streams"

  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.data) return null
    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return [fetchUrl, userTwitchKey]

    let apiUrl = fetchUrl
    // Check if the URL already contains a question mark
    if (apiUrl.includes("?")) {
      apiUrl += `&after=${previousPageData.pagination.cursor}`
    } else {
      apiUrl += `?after=${previousPageData.pagination.cursor}`
    }

    return [apiUrl, userTwitchKey]
  }

  const {
    data: pageArray,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, twitchFetcher, {
    refreshInterval: 1000 // odświeżaj co sekundę
  })

  console.log(pageArray);

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

export default TwitchStreams
