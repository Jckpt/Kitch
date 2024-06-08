import { useAutoAnimate } from "@formkit/auto-animate/react"
import { IconRefresh } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React, { useState } from "react"

import { searchQueryAtom } from "~src/lib/util"
import { sendRuntimeMessage } from "~src/lib/util/helperFunc"

import PlatformIcon from "../PlatformIcon"
import { Input } from "../ui/input"

const TopBar = ({ twitchLoggedIn }) => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [parent] = useAutoAnimate({ duration: 300 })
  const handleRefresh = () => {
    // disable button if already refreshing
    if (isRefreshing) return

    setIsRefreshing(true)
    sendRuntimeMessage("refresh")
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }
  return (
    <div
      className="p-2 h-12 flex-grow-0 flex-shrink flex justify-between gap-2 items-center bg-zinc-900"
      ref={parent}>
      <PlatformIcon />
      <Input
        type="input"
        className="w-3/4 rounded-md border-0 bg-neutral-800"
        placeholder="Search"
        value={searchQuery}
        disabled={!twitchLoggedIn}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <IconRefresh
        className={`hover:cursor-pointer opacity-75 hover:opacity-100 
      ${isRefreshing ? "animate-[spin_1s_linear_1]" : ""}
      `}
        onClick={handleRefresh}
      />
    </div>
  )
}

export default TopBar
