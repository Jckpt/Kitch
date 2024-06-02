import { IconLoader2 } from "@tabler/icons-react"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import { useStorage } from "@plasmohq/storage/hook"

import { cn } from "~lib/util"
import { twitchFetcher } from "~lib/util/fetcher"

const InfiniteList = ({ searchQuery, fetchUrl, children, className = "" }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")

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
        console.log(isLoading, size)
        console.log(list.scrollTop, list.clientHeight, list.scrollHeight)
        if (!isLoading) {
          setSize(size + 1)
        }
      }
    }

    list?.addEventListener("scroll", handleScroll)

    return () => {
      list?.removeEventListener("scroll", handleScroll)
    }
  }, [scrollToTop, listRef, isLoading, size])

  useEffect(() => {
    console.log(children)
    setScrollToTop(true) // Trigger scroll to top when children change
  }, [children])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className={cn("overflow-y-auto flex flex-col h-full", className)}>
      {pageArray.map((items) => {
        // `data` is an array of each page's API response.
        return items?.data?.map((item) =>
          // Render the child component
          children(item)
        )
      })}
    </div>
  )
}

export default InfiniteList
