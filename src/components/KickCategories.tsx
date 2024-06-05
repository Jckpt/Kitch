import { IconLoader2 } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import { categoryAtom } from "~src/lib/util"
import { kickFetcher } from "~src/lib/util/fetcher"

import { MappedCategories, MappedStreams } from "./Mapped"

const KickCategories = ({ searchQuery, debouncedSearchQuery }) => {
  const [category] = useAtom(categoryAtom)
  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)
  const fetchUrl =
    category === ""
      ? "http://localhost:3000/api/subcategories"
      : `http://localhost:3000/api/livestreams?subcategory=${category}`
  const getKey = (pageIndex, previousPageData) => {
    // first page, we don't have `previousPageData`
    console.log(pageIndex)
    if (pageIndex === 0) return fetchUrl
    if (fetchUrl.includes("?")) {
      return `${fetchUrl}&page=${pageIndex}`
    }
    return `${fetchUrl}?page=${pageIndex}`
  }

  const {
    data: pageArray,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, kickFetcher)

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
  return (
    <MappedStreams pageArray={pageArray} listRef={listRef} variant="Kick" />
  )
}

export default KickCategories
