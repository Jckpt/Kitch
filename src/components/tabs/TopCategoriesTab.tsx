import { IconLoader2 } from "@tabler/icons-react"
import { atom, useAtom } from "jotai"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import StreamItem from "../../components/StreamItem"
import { twitchFetcher } from "../../lib/util/fetcher"
import { categoryUrl } from "../../lib/util/helperFunc"
import GameItem from "../GameItem"

export const categoryAtom = atom("")

const TopCategoriesTab = ({ searchQuery, userTwitchKey, debouncedSearchQuery }) => {
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  const [category] = useAtom(categoryAtom)
  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)
  const fetchUrl = categoryUrl(category, searchQuery)
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
  } = useSWRInfinite(getKey, twitchFetcher)

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

  if (!pageArray || searchQuery !== debouncedSearchQuery) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (category == "") {
    return (
      <MappedCategories
        category={category}
        pageArray={pageArray}
        listRef={listRef}
      />
    )
  }
  return <MappedStreams pageArray={pageArray} listRef={listRef} />
}

const MappedCategories = ({ category, pageArray, listRef }) => {
  return (
    <div ref={listRef} className="overflow-y-auto h-full">
      <div className="grid grid-cols-4 w-full">
        {pageArray.map((games) => {
          return games.data.map((game) => (
            <GameItem game={game} category={category} key={game.id} />
          ))
        })}
      </div>
    </div>
  )
}

const MappedStreams = ({ pageArray, listRef }) => {
  return (
    <div ref={listRef} className="overflow-y-auto flex flex-col h-full">
      {pageArray.map((streams) => {
        return streams.data.map((stream) => (
          <StreamItem stream={stream} key={stream.id} />
        ))
      })}
    </div>
  )
}

export default TopCategoriesTab
