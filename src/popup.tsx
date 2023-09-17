import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import FollowStreamList from "~components/FollowStreamList"
import { Input } from "~components/ui/input"

import "~style.css"

import Login from "~components/Login"

function IndexPopup() {
  const [searchChannel, setSearchChannel] = useState("")
  const [userTwitchKey] = useStorage("userTwitchKey")
  const needToLogin = userTwitchKey === undefined
  console.log(userTwitchKey)
  return (
    <div className="h-[32rem] w-96 flex text-white">
      <div className="h-full w-12 bg-zinc-900 justify-center pt-8 pb-8 flex">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
          <path
            fill="currentColor"
            d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43Z"
          />
        </svg>
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
