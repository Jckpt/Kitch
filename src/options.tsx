import React, { useEffect, useState } from "react"

import "./style.css"

import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "~components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "~components/ui/card"

type UserTwitchKey = {
  access_token: string
  client_id: string
}

function OptionsIndex() {
  const [userTwitchKey, setUserTwitchKey, { remove: removeTwitch }] =
    useStorage("userTwitchKey")
  const saveToStorageTwitch = () => {
    const hash = window.location.hash.substring(1)
    if (hash === "") return

    const result = hash.split("&").reduce((res, item) => {
      const parts = item.split("=")
      res[parts[0]] = parts[1]
      return res
    }, {} as UserTwitchKey)
    result.client_id = "256lknox4x75bj30rwpctxna2ckbmn"

    setUserTwitchKey(result)
  }
  const logOutTwitch = () => {
    removeTwitch()
  }
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("callback") === "twitch") {
      saveToStorageTwitch()
    }
  }, [])
  return (
    <div className="h-screen flex justify-center items-center flex-col gap-6 bg-neutral-800">
      <Card className="w-[350px] flex flex-col border-none bg-neutral-900 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Options</CardTitle>
          <CardDescription>Log out</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 justify-center">
          <Button
            className="w-full bg-purple-600 hover:bg-red-600"
            disabled={userTwitchKey === undefined}
            onClick={logOutTwitch}>
            Log out of Twitch
          </Button>
          <Button
            className="w-full bg-green-600 hover:bg-red-600"
            disabled={true}
            onClick={logOutTwitch}>
            Log out of Kick
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default OptionsIndex
