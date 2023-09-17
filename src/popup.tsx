import {
  IconChartBar,
  IconChartCandle,
  IconDeviceGamepad,
  IconSearch,
  IconUsers
} from "@tabler/icons-react"
//@ts-ignore
import Logo from "data-url:./images/icon.png"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import FollowStreamList from "~components/FollowStreamList"
import { Input } from "~components/ui/input"

import "~style.css"

import IconWrapper from "~components/IconWrapper"
import Login from "~components/Login"

function IndexPopup() {
  const [searchChannel, setSearchChannel] = useState("")
  const [userTwitchKey] = useStorage("userTwitchKey")
  const needToLogin = userTwitchKey === undefined
  console.log(userTwitchKey)
  return (
    <div className="h-[32rem] w-96 flex text-white">
      <div className="h-full w-12 bg-zinc-900 pt-3 flex flex-col">
        <div className="flex items-end justify-center">
          <img
            src={Logo}
            className="w-7 h-7"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
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
      </div>
      <div className="w-full h-full bg-neutral-900 flex flex-col">
        <div className="basis-12 p-2 flex-grow-0 flex-shrink flex justify-center items-center border-b border-neutral-950 bg-neutral-900">
          <Input
            type="input"
            className="w-3/4 border-0 bg-neutral-800"
            placeholder="Search channel"
            value={searchChannel}
            disabled={needToLogin}
            onChange={(e) => setSearchChannel(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-grow">
          {needToLogin ? (
            <Login />
          ) : (
            <FollowStreamList searchChannel={searchChannel} />
          )}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
