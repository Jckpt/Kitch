import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Tabs, TabsContent } from "./components/ui/tabs"

import "./style.css"

import { useAtom } from "jotai"

import FollowedTab from "./components/tabs/FollowedTab"
import LoginTab from "./components/tabs/LoginTab"
import OptionsTab from "./components/tabs/OptionsTab"
import SearchTab from "./components/tabs/SearchTab"
import SidebarTabs from "./components/tabs/SidebarTabs"
import TopBar from "./components/tabs/TopBar"
import TopCategoriesTab from "./components/tabs/TopCategoriesTab"
import TopStreamTab from "./components/tabs/TopStreamsTab"
import { categoryAtom, platformAtom, searchQueryAtom } from "./lib/util"

function IndexPopup() {
  const [_, setSearchQuery] = useAtom(searchQueryAtom)
  const [platform, setPlatform] = useAtom(platformAtom)
  const [category, setCategory] = useAtom(categoryAtom)
  const [currentTab, setCurrentTab] = React.useState("followed")

  const [userTwitchKey] = useStorage("userTwitchKey")
  const twitchLoggedIn = userTwitchKey !== undefined
  const handleTabsClick = (value: string) => {
    setCurrentTab(value)
    setCategory("")
    setSearchQuery("")
  }

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabsClick}
      defaultValue="followed"
      className="h-[32rem] w-96 flex text-white">
      <div className="h-full w-12 bg-zinc-900 pt-3 flex flex-col">
        <SidebarTabs />
      </div>
      <div className="w-full bg-neutral-900 flex flex-col">
        <TopBar 
          twitchLoggedIn={twitchLoggedIn} 
          currentTab={currentTab}
          platform={platform}
        />
        {true ? (
          <>
            <TabsContent className="overflow-y-auto flex-grow" value="followed">
              <FollowedTab />
            </TabsContent>
            <TabsContent
              className="overflow-y-auto flex-grow"
              value="top_streams">
              <TopStreamTab userTwitchKey={userTwitchKey} key={platform} />
            </TabsContent>
            <TabsContent
              className="overflow-y-auto flex-grow"
              value="categories">
              <TopCategoriesTab userTwitchKey={userTwitchKey} key={category} />
            </TabsContent>
            <TabsContent className="overflow-y-auto flex-grow" value="search">
              <SearchTab userTwitchKey={userTwitchKey} />
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
