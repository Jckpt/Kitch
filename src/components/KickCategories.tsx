import { IconLoader2 } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import { useDebounce } from "use-debounce"

import { API_URL } from "~src/lib/util/config"
import { categoryAtom, searchQueryAtom } from "~src/lib/util"
import { kickFetcher } from "~src/lib/util/fetcher"
import { transformKickData } from "~src/lib/util/helperFunc"

import { MappedCategories, MappedStreams } from "./Mapped"

const KickCategories = () => {
  const [category] = useAtom(categoryAtom)
  const [searchQuery] = useAtom(searchQueryAtom)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 200)
  
  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)
  
  // Build fetch URL with search query support
  const fetchUrl = category === ""
    ? `${API_URL}/api/categories${debouncedSearchQuery ? `?q=${encodeURIComponent(debouncedSearchQuery)}` : ""}`
    : `${API_URL}/api/livestreams?category_id=${category}`
  const getKey = (pageIndex, previousPageData) => {
    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return fetchUrl
    
    // Categories endpoint doesn't support pagination - only fetch once
    if (category === "") {
      return null
    }
    
    // For livestreams, check if we reached the end
    if (previousPageData.reached_end) return null

    if (fetchUrl.includes("?")) {
      return `${fetchUrl}&page=${pageIndex + 1}`
    }
    return `${fetchUrl}?page=${pageIndex + 1}`
  }

  const {
    data: pageArray,
    isLoading,
    size,
    setSize,
  } = useSWRInfinite(getKey, async (...args) => {
    if (category !== "") {
      const data = await kickFetcher(...args)
      return transformKickData(data)
    } 
    
    return await kickFetcher(...args) 
  })

  useEffect(() => {
    if (!listRef.current || category !== "") return

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

  if (!pageArray || isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Additional check for empty data
  if (pageArray.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-400">No data available</p>
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
  return (
    <MappedStreams pageArray={pageArray} listRef={listRef} variant="Kick" />
  )
}

export default KickCategories
