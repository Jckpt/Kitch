import { useAtom } from "jotai"

import { categoryAtom, platformAtom } from "~src/lib/util"

import KickCategories from "../KickCategories"
import TwitchCategories from "../TwitchCategories"

const TopCategoriesTab = ({ userTwitchKey }) => {
  const [category] = useAtom(categoryAtom)
  const [platform] = useAtom(platformAtom)
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  if (platform === "twitch") {
    return <TwitchCategories key={category} userTwitchKey={userTwitchKey} />
  } else if (platform === "kick") {
    return <KickCategories key={category} />
  } else {
    return null
  }
}

export default TopCategoriesTab
