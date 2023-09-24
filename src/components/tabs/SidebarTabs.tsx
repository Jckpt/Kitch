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

import { TabsList, TabsTrigger } from "~components/ui/tabs"

import { categoryAtom } from "./TopCategoriesTab"

const SidebarTabs = () => {
  const [category, setCategory] = useAtom(categoryAtom)

  const handleClick = () => {
    if (category !== "") setCategory("")
  }
  return (
    <TabsList className="flex bg-zinc-900 flex-col justify-center items-center flex-1 gap-4">
      <TabsTrigger className="p-1" value="followed">
        <IconUsers />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="top_streams">
        <IconChartBar />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="categories" onClick={handleClick}>
        {category === "" ? (
          <IconDeviceGamepad />
        ) : (
          <IconChevronLeft className="stroke-white" />
        )}
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
