import { IconRefresh } from "@tabler/icons-react"
import { useAtom } from "jotai"
import React, { useState } from "react"

import { currentTabAtom } from "~src/lib/util"
import { sendRuntimeMessage } from "~src/lib/util/helperFunc"

const RefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTab] = useAtom(currentTabAtom)
  const handleRefresh = () => {
    // disable button if already refreshing
    if (isRefreshing) return

    setIsRefreshing(true)
    sendRuntimeMessage("refresh")
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }
  if (currentTab === "followed") {
    return (
      <span className={isRefreshing ? "animate-[spin_1s_linear_1]" : ""}>
        <IconRefresh
          className={`transition-opacity ease-in-out duration-300 hover:cursor-pointer opacity-75 hover:opacity-100 
      
      `}
          onClick={handleRefresh}
        />
      </span>
    )
  }
  return (
    <span className={isRefreshing ? "animate-[spin_1s_linear_1]" : ""}>
      <IconRefresh
        className={`transition-opacity ease-in-out duration-300 opacity-20 ${isRefreshing ? "animate-[spin_1s_linear_1]" : ""} `}
      />
    </span>
  )
}

export default RefreshButton
