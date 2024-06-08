import { IconBrandKickstarter, IconBrandTwitch } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React from "react"

import { categoryAtom, currentTabAtom, platformAtom } from "~src/lib/util"

const PlatformIcon = () => {
  const [currentTab] = useAtom(currentTabAtom)
  const [category, setCategory] = useAtom(categoryAtom)
  const [platform, setPlatform] = useAtom(platformAtom)
  const blacklistedTabs = ["followed", "search", "options"]
  const handleChangePlatform = () => {
    if (blacklistedTabs.includes(currentTab)) return

    setPlatform((prev) => (prev === "twitch" ? "kick" : "twitch"))
    setCategory("")
  }

  if (platform === "twitch") {
    return (
      <IconBrandTwitch
        className={`transition-all ease-in-out duration-300 ${blacklistedTabs.includes(currentTab) ? "opacity-20" : "hover:cursor-pointer opacity-75 hover:opacity-100"}`}
        onClick={handleChangePlatform}
      />
    )
  }
  if (platform === "kick") {
    return (
      <IconBrandKickstarter
        className={`transition-all ease-in-out duration-300 ${blacklistedTabs.includes(currentTab) ? "opacity-20" : "hover:cursor-pointer opacity-75 hover:opacity-100"}`}
        onClick={handleChangePlatform}
      />
    )
  }
}

export default PlatformIcon
