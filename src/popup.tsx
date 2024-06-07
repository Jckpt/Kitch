import React, { useState } from "react"
import { useDebounce } from "use-debounce"

import { useStorage } from "@plasmohq/storage/hook"

import { Input } from "./components/ui/input"
import { Tabs, TabsContent } from "./components/ui/tabs"

import "./style.css"

import {
  IconBrandKickstarter,
  IconBrandTwitch,
  IconRefresh
} from "@tabler/icons-react"
import { useAtom } from "jotai"

import FollowedTab from "./components/tabs/FollowedTab"
import LoginTab from "./components/tabs/LoginTab"
import OptionsTab from "./components/tabs/OptionsTab"
import SearchTab from "./components/tabs/SearchTab"
import SidebarTabs from "./components/tabs/SidebarTabs"
import TopCategoriesTab from "./components/tabs/TopCategoriesTab"
import TopStreamTab from "./components/tabs/TopStreamsTab"
import { categoryAtom, currentTabAtom } from "./lib/util"
import { sendRuntimeMessage } from "./lib/util/helperFunc"

function IndexPopup() {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 200)

  const [userTwitchKey] = useStorage("userTwitchKey")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [category, setCategory] = useAtom(categoryAtom)
  const [currentTab] = useAtom(currentTabAtom)
  const [platform, setPlatform] = useState("twitch")
  const twitchLoggedIn = userTwitchKey !== undefined
  const blacklistedTabs = ["followed", "search", "options"]
  const handleTabsClick = () => {
    setCategory("")
    setSearchQuery("")
  }
  const handleChangePlatform = () => {
    if (blacklistedTabs.includes(currentTab)) return

    setPlatform((prev) => (prev === "twitch" ? "kick" : "twitch"))
    setCategory("")
  }
  const handleRefresh = () => {
    // disable button if already refreshing
    if (isRefreshing) return

    setIsRefreshing(true)
    sendRuntimeMessage("refresh")
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }
  return (
    <Tabs
      onValueChange={handleTabsClick}
      defaultValue="followed"
      className="h-[32rem] w-96 flex text-white">
      <div className="h-full w-12 bg-zinc-900 pt-3 flex flex-col">
        <SidebarTabs />
      </div>
      <div className="w-full h-full bg-neutral-900 flex flex-col">
        <div className="p-2 h-12 flex-grow-0 flex-shrink flex justify-between gap-2 items-center bg-zinc-900">
          {platform === "twitch" || blacklistedTabs.includes(currentTab) ? (
            <IconBrandTwitch
              className={`${blacklistedTabs.includes(currentTab) ? "opacity-20" : "hover:cursor-pointer opacity-75 hover:opacity-100"}`}
              onClick={handleChangePlatform}
            />
          ) : platform === "kick" ? (
            <IconBrandKickstarter
              className={`${blacklistedTabs.includes(currentTab) ? "opacity-20" : "hover:cursor-pointer opacity-75 hover:opacity-100"}`}
              onClick={handleChangePlatform}
            />
          ) : null}
          <Input
            type="input"
            className="w-3/4 rounded-md border-0 bg-neutral-800"
            placeholder="Search"
            value={searchQuery}
            disabled={!twitchLoggedIn}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconRefresh
            className={`hover:cursor-pointer opacity-75 hover:opacity-100 
            ${isRefreshing ? "animate-[spin_1s_linear_1]" : ""}
            `}
            onClick={handleRefresh}
          />
        </div>
        {twitchLoggedIn ? (
          <>
            <TabsContent className="overflow-y-auto flex-grow" value="followed">
              <FollowedTab searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent
              className="overflow-y-auto flex-grow"
              value="top_streams">
              <TopStreamTab
                searchQuery={debouncedSearchQuery}
                userTwitchKey={userTwitchKey}
                platform={platform}
                debouncedSearchQuery={debouncedSearchQuery}
                key={platform}
              />
            </TabsContent>
            <TabsContent
              className="overflow-y-auto flex-grow"
              value="categories">
              <TopCategoriesTab
                searchQuery={searchQuery}
                debouncedSearchQuery={debouncedSearchQuery}
                userTwitchKey={userTwitchKey}
                key={category}
                platform={platform}
              />
            </TabsContent>
            <TabsContent className="overflow-y-auto flex-grow" value="search">
              <SearchTab
                searchQuery={debouncedSearchQuery}
                userTwitchKey={userTwitchKey}
              />
            </TabsContent>
            <TabsContent
              className="p-0 m-0 overflow-y-auto flex-grow"
              value="options">
              <OptionsTab />
            </TabsContent>
          </>
        ) : (
          <div className="p-0 m-0 overflow-y-auto flex-grow">
            <LoginTab />
          </div>
        )}
      </div>
    </Tabs>
  )
}

export default IndexPopup
