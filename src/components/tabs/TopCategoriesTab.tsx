import KickCategories from "../KickCategories"
import TwitchCategories from "../TwitchCategories"

const TopCategoriesTab = ({
  searchQuery,
  userTwitchKey,
  debouncedSearchQuery,
  platform
}) => {
  // if category is not empty, fetch streams, else fetch games, and render accordingly
  if (platform === "twitch") {
    return (
      <TwitchCategories
        searchQuery={searchQuery}
        userTwitchKey={userTwitchKey}
        debouncedSearchQuery={debouncedSearchQuery}
      />
    )
  } else if (platform === "kick") {
    return (
      <KickCategories
        searchQuery={searchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
      />
    )
  } else {
    return null
  }
}

export default TopCategoriesTab
