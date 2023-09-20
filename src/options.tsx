import React, { useEffect, useState } from "react"

import "./style.css"

import { useStorage } from "@plasmohq/storage/hook"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~components/ui/card"
import { type UserTwitchKey } from "~lib/types/twitchTypes"
import { getTwitchUser } from "~lib/util/fetcher"

function OptionsIndex() {
  const [didLogin, setDidLogin] = useState<boolean>(null)
  const [callbackSite, setCallbackSite] = useState<"twitch" | "kick">(null)
  const [_, setUserTwitchKey] = useStorage("userTwitchKey")
  const getTwitchCredentials = () => {
    const hash = window.location.hash.substring(1)
    if (hash === "") return

    const result = hash.split("&").reduce((res, item) => {
      const parts = item.split("=")
      res[parts[0]] = parts[1]
      return res
    }, {} as UserTwitchKey)
    result.client_id = "256lknox4x75bj30rwpctxna2ckbmn"
    return result
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("callback") === "twitch") {
      const credentials = getTwitchCredentials()
      getTwitchUser(credentials).then((userData) => {
        const newCredentials = { user_id: userData.id, ...credentials }
        setCallbackSite("twitch")
        setDidLogin(true)
        setUserTwitchKey(newCredentials)
      })
    }
  }, [])
  return (
    <div className="h-screen flex justify-center items-center flex-col gap-6 bg-neutral-800">
      <Card className="w-[350px] flex flex-col border-none bg-neutral-900 text-white">
        <CardHeader>
          <CardTitle className="text-xl">
            {didLogin === true ? "Login successful" : "Login failed"}
          </CardTitle>
          <CardDescription className="capitalize">
            {callbackSite}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-base">
          {didLogin === true
            ? "You can now close this window."
            : "Something went wrong."}
        </CardContent>
      </Card>
    </div>
  )
}

export default OptionsIndex
