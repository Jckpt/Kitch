import { useAtom } from "jotai"

import { platformAtom } from "~src/lib/util"

import KickStreams from "../KickStreams"
import TwitchStreams from "../TwitchStreams"

const TopStreams = ({ userTwitchKey }) => {
  const [platform] = useAtom(platformAtom)
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  if (platform === "twitch") {
    return <TwitchStreams userTwitchKey={userTwitchKey} />
  } else if (platform === "kick") {
    return <KickStreams />
  } else {
    return null
  }
}

export default TopStreams
