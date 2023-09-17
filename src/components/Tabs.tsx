import {
  IconChartBar,
  IconChartCandle,
  IconDeviceGamepad,
  IconSearch,
  IconUsers
} from "@tabler/icons-react"
import React from "react"

import IconWrapper from "~components/IconWrapper"

const Tabs = () => {
  return (
    <div className="flex flex-col justify-center items-center flex-1 gap-4">
      <IconWrapper>
        <IconUsers />
      </IconWrapper>
      <IconWrapper>
        <IconChartBar />
      </IconWrapper>
      <IconWrapper>
        <IconDeviceGamepad />
      </IconWrapper>
      <IconWrapper>
        <IconSearch />
      </IconWrapper>
      <IconWrapper>
        <IconChartCandle
          onClick={() => {
            chrome.tabs.create({
              url: "./options.html"
            })
          }}
        />
      </IconWrapper>
    </div>
  )
}

export default Tabs
