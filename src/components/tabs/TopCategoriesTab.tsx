import { useAtom } from "jotai"

import { categoryAtom, platformAtom } from "~src/lib/util"

import KickCategories from "../KickCategories"
import TwitchCategories from "../TwitchCategories"

const TopCategoriesTab = ({
  searchQuery,
  userTwitchKey,
  debouncedSearchQuery
}) => {
  const [category] = useAtom(categoryAtom)
  const [platform] = useAtom(platformAtom)
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  if (platform === "twitch") {
    return (
      <TwitchCategories
        key={category}
        searchQuery={searchQuery}
        userTwitchKey={userTwitchKey}
        debouncedSearchQuery={debouncedSearchQuery}
      />
    )
  } else if (platform === "kick") {
    return (
      <KickCategories
        key={category}
        searchQuery={searchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
      />
    )
  } else {
    return null
  }
}

export default TopCategoriesTab
