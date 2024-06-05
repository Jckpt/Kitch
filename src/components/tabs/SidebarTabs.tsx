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

import { categoryAtom } from "~src/lib/util"

import { TabsList, TabsTrigger } from "../../components/ui/tabs"
import { kickMenuAtom } from "./OptionsTab"

const SidebarTabs = () => {
  const [category, setCategory] = useAtom(categoryAtom)
  const [kickMenu, setKickMenu] = useAtom(kickMenuAtom)

  const handleClick = () => {
    if (category !== "") setCategory("")
    if (kickMenu) setKickMenu(false)
  }
  return (
    <TabsList className="flex bg-zinc-900 flex-col justify-center items-center flex-1 gap-4">
      <TabsTrigger className="p-1" value="followed" onClick={handleClick}>
        <IconUsers />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="top_streams" onClick={handleClick}>
        <IconChartBar />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="categories" onClick={handleClick}>
        {category === "" ? (
          <IconDeviceGamepad />
        ) : (
          <IconChevronLeft className="stroke-white" />
        )}
      </TabsTrigger>
      <TabsTrigger className="p-1" value="search" onClick={handleClick}>
        <IconSearch />
      </TabsTrigger>
      <TabsTrigger className="p-1" value="options" onClick={handleClick}>
        {kickMenu === false ? (
          <IconChartCandle />
        ) : (
          <IconChevronLeft className="stroke-white" />
        )}
      </TabsTrigger>
    </TabsList>
  )
}

export default SidebarTabs
