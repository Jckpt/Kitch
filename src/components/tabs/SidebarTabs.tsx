import {
  IconChartBar,
  IconChartCandle,
  IconChevronLeft,
  IconDeviceGamepad,
  IconSearch,
  IconUsers
} from "@tabler/icons-react"
import { useAtom } from "jotai"
import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { categoryAtom, currentTabAtom, platformAtom } from "~src/lib/util"

import NewUserTooltip from "../NewUserTooltip"
import { TabsList, TabsTrigger } from "../ui/tabs"
import { kickMenuAtom } from "./OptionsTab"

const SidebarTabs = () => {
  const [category, setCategory] = useAtom(categoryAtom)
  const [kickMenu, setKickMenu] = useAtom(kickMenuAtom)
  const [currentTab, setCurrentTab] = useAtom(currentTabAtom)
  const [platform, setPlatform] = useAtom(platformAtom)
  //usertwitchkey
  const [userTwitchKey] = useStorage("userTwitchKey")
  const [isNewUser] = useStorage<boolean>("isNewUser")
  const [kickFollows] = useStorage<string[]>("kickFollows")
  const twitchLoggedIn = userTwitchKey !== undefined

  const handleClick = (tabName) => {
    if (!twitchLoggedIn) {
      setPlatform("kick")
    }
    if (category !== "") setCategory("")
    if (kickMenu) setKickMenu(false)
    if (tabName) setCurrentTab(tabName)
  }
  return (
    <TabsList className="flex bg-zinc-900 flex-col justify-center items-center flex-1 gap-4">
      <TabsTrigger
        className="p-1"
        value="followed"
        onMouseDown={() => handleClick("followed")}>
        <IconUsers />
      </TabsTrigger>
      <TabsTrigger
        className="p-1"
        value="top_streams"
        onMouseDown={() => handleClick("top_streams")}>
        <IconChartBar />
      </TabsTrigger>
      <TabsTrigger
        className="p-1"
        value="categories"
        onMouseDown={() => handleClick("categories")}>
        {category === "" ? (
          <IconDeviceGamepad />
        ) : (
          <IconChevronLeft className="stroke-white" />
        )}
      </TabsTrigger>
      <TabsTrigger
        className="p-1"
        value="search"
        onMouseDown={() => handleClick("search")}>
        <IconSearch />
      </TabsTrigger>
      <TabsTrigger
        className="p-1 relative"
        value="options"
        onMouseDown={() => handleClick("options")}>
        {kickMenu === false ? (
          <IconChartCandle />
        ) : (
          <IconChevronLeft className="stroke-white" />
        )}
        <NewUserTooltip 
          isVisible={
            isNewUser === true && 
            !twitchLoggedIn && 
            (!kickFollows || kickFollows.length === 0) &&
            currentTab === "followed"
          } 
        />
      </TabsTrigger>
    </TabsList>
  )
}

export default SidebarTabs
