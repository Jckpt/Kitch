import { IconBrandKickstarter, IconBrandTwitch, IconWorld } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React from "react"

import { categoryAtom, currentTabAtom, platformAtom, followedLiveFilterAtom } from "~src/lib/util"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

const PlatformIcon = ({ disabled }) => {
  const [currentTab] = useAtom(currentTabAtom)
  const [category, setCategory] = useAtom(categoryAtom)
  const [platform, setPlatform] = useAtom(platformAtom)
  const [followedLiveFilter, setFollowedLiveFilter] = useAtom(followedLiveFilterAtom)
  const blacklistedTabs = ["search", "options"]

  const handleChangePlatform = () => {
    if (blacklistedTabs.includes(currentTab) || disabled) return

    setPlatform((prev) => (prev === "twitch" ? "kick" : "twitch"))
    setCategory("")
  }

  const handleFilterChange = () => {
    if (followedLiveFilter === "All") {
      setFollowedLiveFilter("Kick")
    } else if (followedLiveFilter === "Kick") {
      setFollowedLiveFilter("Twitch")
    } else {
      setFollowedLiveFilter("All")
    }
  }

  if (currentTab === "followed") {
    return (
      <div className="flex gap-2">
        {blacklistedTabs.includes(currentTab) ? (
          <button
            className='transition-all ease-in-out duration-300 opacity-20'
          >
            {followedLiveFilter === "All" && <IconWorld />}
            {followedLiveFilter === "Twitch" && <IconBrandTwitch />}
            {followedLiveFilter === "Kick" && <IconBrandKickstarter />}
          </button>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='transition-all ease-in-out duration-300 opacity-75 hover:opacity-100'
                  onClick={handleFilterChange}>
                  {followedLiveFilter === "All" && <IconWorld />}
                  {followedLiveFilter === "Twitch" && <IconBrandTwitch />}
                  {followedLiveFilter === "Kick" && <IconBrandKickstarter />}
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-50 text-slate-900">
                <p>Filter: {followedLiveFilter}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  const iconClass = `transition-all ease-in-out duration-300 ${
    blacklistedTabs.includes(currentTab) || disabled
      ? "opacity-20"
      : "hover:cursor-pointer opacity-75 hover:opacity-100"
  }`

  if (platform === "twitch") {
    return blacklistedTabs.includes(currentTab) ? (
      <IconBrandTwitch
        className={iconClass}
      />
    ) : (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconBrandTwitch
              className={iconClass}
              onClick={handleChangePlatform}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-slate-50 text-slate-900">
            <p>Switch to Kick</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  if (platform === "kick") {
    return blacklistedTabs.includes(currentTab) ? (
      <IconBrandKickstarter
        className={iconClass}
      />
    ) : (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconBrandKickstarter
              className={iconClass}
              onClick={handleChangePlatform}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-slate-50 text-slate-900">
            <p>Switch to Twitch</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
}

export default PlatformIcon
