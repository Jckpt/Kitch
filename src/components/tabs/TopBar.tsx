import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useAtom } from "jotai"
import React from "react"

import { searchQueryAtom } from "~src/lib/util"

import PlatformIcon from "../PlatformIcon"
import RefreshButton from "../RefreshButton"
import { Input } from "../ui/input"

const TopBar = ({ twitchLoggedIn }) => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)

  const [parent] = useAutoAnimate({ duration: 300 })

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
      <RefreshButton />
    </div>
  )
}

export default TopBar
