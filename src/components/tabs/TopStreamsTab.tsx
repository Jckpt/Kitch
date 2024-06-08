import { useAtom } from "jotai"

import { categoryAtom, platformAtom } from "~src/lib/util"

import KickStreams from "../KickStreams"
import TwitchStreams from "../TwitchStreams"

const TopStreams = ({ searchQuery, userTwitchKey, debouncedSearchQuery }) => {
  const [category] = useAtom(categoryAtom)
  const [platform] = useAtom(platformAtom)
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  if (platform === "twitch") {
    return (
      <TwitchStreams searchQuery={searchQuery} userTwitchKey={userTwitchKey} />
    )
  } else if (platform === "kick") {
    return (
      <KickStreams
        searchQuery={searchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
      />
    )
  } else {
    return null
  }
}

export default TopStreams
