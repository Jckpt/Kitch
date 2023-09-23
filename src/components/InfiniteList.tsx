import { IconLoader2 } from "@tabler/icons-react"
import React, { useEffect, useRef } from "react"
import useSWRInfinite from "swr/infinite"

import { useStorage } from "@plasmohq/storage/hook"

import { cn } from "~lib/util"
import { twitchFetcher } from "~lib/util/fetcher"

const InfiniteList = ({ searchQuery, fetchUrl, children, className = "" }) => {
  const [userTwitchKey] = useStorage("userTwitchKey")
  const listRef = useRef(null)

  const getKey = (pageIndex, previousPageData) => {
    // reached the end
    if (previousPageData && !previousPageData.data) return null

    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return [fetchUrl, userTwitchKey]

    // add the cursor to the API endpoint
    return [
      `${fetchUrl}?after=${previousPageData.pagination.cursor}`,
      userTwitchKey
    ]
  }

  const {
    data: pageArray,
    isLoading,
    size,
    setSize
  } = useSWRInfinite(getKey, twitchFetcher)

  useEffect(() => {
    const list = listRef.current

    const handleScroll = () => {
      if (list && list?.scrollTop + list?.clientHeight >= list?.scrollHeight) {
        // Reached the end of the list, load more data
        if (!isLoading) {
          setSize(size + 1)
        }
      }
    }

    list?.addEventListener("scroll", handleScroll)

    return () => {
      list?.removeEventListener("scroll", handleScroll)
    }
  }, [isLoading, size, setSize])

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
