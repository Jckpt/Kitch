import { IconLoader2 } from "@tabler/icons-react"
import React, { useEffect, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"

import { API_URL } from "~src/lib/util/config"
import { kickFetcher } from "~src/lib/util/fetcher"
import { transformKickData } from "~src/lib/util/helperFunc"

import { MappedStreams } from "./Mapped"

const KickStreams = () => {
  const listRef = useRef(null)
  const [scrollToTop, setScrollToTop] = useState(false)
  const fetchUrl = `${API_URL}/api/livestreams`
  const getKey = (pageIndex, previousPageData) => {
    // first page, we don't have `previousPageData`
    if (pageIndex === 0) return fetchUrl
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
    setSize
  } = useSWRInfinite(getKey, async (...args) => {
    const data = await kickFetcher(...args)
    return transformKickData(data)
  })

  // useEffect(() => {
  //   if (!listRef.current) return

  //   const list = listRef.current
  //   if (scrollToTop && listRef) {
  //     list.scrollTop = 0
  //     setScrollToTop(false)
  //   }

  //   const handleScroll = () => {
  //     if (list && list.scrollTop + list.clientHeight >= list.scrollHeight) {
  //       // Reached the end of the list, load more data

  //       if (!isLoading) {
  //         setSize((prevSize) => prevSize + 1)
  //       }
  //     }
  //   }

  //   list?.addEventListener("scroll", handleScroll)

  //   return () => {
  //     list?.removeEventListener("scroll", handleScroll)
  //   }
  // }, [scrollToTop, listRef, isLoading, size])

  if (!pageArray) {
    return (
      <div className="flex justify-center items-center h-full">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <MappedStreams pageArray={pageArray} listRef={listRef} variant="Kick" />
  )
}

export default KickStreams
