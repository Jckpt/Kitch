import { useAtom } from "jotai"
import React from "react"

import { searchQueryAtom } from "~src/lib/util"

import PlatformIcon from "../PlatformIcon"
import RefreshButton from "../RefreshButton"
import { Input } from "../ui/input"

const TopBar = ({ twitchLoggedIn }) => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)

  return (
    <div
      className="pt-3 pb-3 flex-grow-0 flex-shrink flex justify-evenly items-center bg-zinc-900">
      <PlatformIcon disabled={!twitchLoggedIn} />
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
