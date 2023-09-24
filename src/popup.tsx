//@ts-ignore
import Logo from "data-url:./images/icon.png"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Input } from "~components/ui/input"
import { Tabs, TabsContent } from "~components/ui/tabs"

import "~style.css"

import FollowedTab from "~components/tabs/FollowedTab"
import OptionsTab from "~components/tabs/OptionsTab"
import SearchTab from "~components/tabs/SearchTab"
import SidebarTabs from "~components/tabs/SidebarTabs"
import TopCategoriesTab from "~components/tabs/TopCategoriesTab"
import TopStreamTab from "~components/tabs/TopStreamsTab"

function IndexPopup() {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [userTwitchKey] = useStorage("userTwitchKey")
  const twitchLoggedIn = userTwitchKey !== undefined
  return (
    <Tabs
      onValueChange={() => setSearchQuery("")}
      defaultValue="followed"
      className="h-[32rem] w-96 flex text-white">
      <div className="h-full w-12 bg-zinc-900 pt-3 flex flex-col">
        <div className="flex items-end justify-center">
          <img
            src={Logo}
            className="w-7 h-7"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <SidebarTabs />
      </div>
      <div className="w-full h-full bg-neutral-900 flex flex-col">
        <div className="basis-12 p-2 h-14 flex-grow-0 flex-shrink flex justify-center items-center border-b border-neutral-950 bg-zinc-900">
          <Input
            type="input"
            className="w-3/4 border-0 bg-neutral-800"
            placeholder="Search"
            value={searchQuery}
            disabled={!twitchLoggedIn}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <TopStreamTab searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent
              className="overflow-y-auto flex-grow"
              value="categories">
              <TopCategoriesTab searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent className="overflow-y-auto flex-grow" value="search">
              <SearchTab searchQuery={searchQuery} />
            </TabsContent>
            <TabsContent
              className="p-0 m-0 overflow-y-auto flex-grow"
              value="options">
              <OptionsTab />
            </TabsContent>
          </>
        ) : (
          <div className="p-0 m-0 overflow-y-auto flex-grow">
            <OptionsTab />
          </div>
        )}
      </div>
    </Tabs>
  )
}

export default IndexPopup
