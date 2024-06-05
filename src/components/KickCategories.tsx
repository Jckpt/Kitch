import { IconLoader2 } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import { categoryAtom } from "~src/lib/util"
import { kickCategoriesFetch } from "~src/lib/util/fetcher"

import GameItem from "./GameItem"
import StreamItem from "./StreamItem"

const KickCategories = ({ searchQuery, debouncedSearchQuery }) => {
  const [category] = useAtom(categoryAtom)
  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)
  const fetchUrl = "http://localhost:3000/api/subcategories"
  const getKey = (pageIndex, previousPageData) => {
    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return fetchUrl
    return previousPageData.next_page_url.replace(
      "https://kick.com/api/v1/",
      "http://localhost:3000/api/"
    )
  }

  const {
    data: pageArray,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, kickCategoriesFetch)

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

export default KickCategories
