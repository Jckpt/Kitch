import {
  IconChartBar,
  IconChartCandle,
  IconDeviceGamepad,
  IconSearch,
  IconUsers
} from "@tabler/icons-react"
import React from "react"

import { TabsList, TabsTrigger } from "~components/ui/tabs"

const SidebarTabs = () => {
  return (
    <TabsList className="flex bg-zinc-900 flex-col justify-center items-center flex-1 gap-4">
      <TabsTrigger className="p-1" value="followed">
        <IconUsers />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="top_streams">
        <IconChartBar />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="categories">
        <IconDeviceGamepad />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="search">
        <IconSearch />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="options">
        <IconChartCandle />
      </TabsTrigger>
    </TabsList>
  )
}

export default SidebarTabs
