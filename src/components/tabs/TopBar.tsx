import { useAtom } from "jotai"
import React from "react"

import { searchQueryAtom } from "~src/lib/util"

import PlatformIcon from "../PlatformIcon"
import RefreshButton from "../RefreshButton"
import { Input } from "../ui/input"

const TopBar = ({ twitchLoggedIn, currentTab, platform }) => {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom)

  // Determine if search should be disabled
  const isSearchDisabled = () => {
    // Disable on top_streams tab
    if (currentTab === "top_streams") {
      return true
    }
    // Disable on search tab if not logged in
    if (currentTab === "search" && !twitchLoggedIn) {
      return true
    }
    // For Twitch, require login
    if (platform === "Twitch" && !twitchLoggedIn) {
      return true
    }
    // Kick doesn't require login
    return false
  }

  return (
    <div
      className="pt-3 pb-3 flex-grow-0 flex-shrink flex justify-evenly items-center bg-zinc-900">
      <PlatformIcon disabled={!twitchLoggedIn} />
      <Input
        type="text"
        className="w-3/4 rounded-md border-0 bg-neutral-800"
        placeholder="Search"
        value={searchQuery}
        disabled={isSearchDisabled()}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <RefreshButton />
    </div>
  )
}

export default TopBar
