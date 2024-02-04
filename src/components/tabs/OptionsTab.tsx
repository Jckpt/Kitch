import { atom, useAtom } from "jotai"
import React, { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "~components/ui/button"
import type { PlatformResponse, PlatformStream } from "~lib/types/twitchTypes"
import {
  getTwitchOAuthURL,
  getTwitchUserId,
  twitchFetcher
} from "~lib/util/fetcher"

import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import KickMenuTab from "./KickMenuTab"

export const kickMenuAtom = atom<boolean>(false)

const OptionsTab = () => {
  const [kickMenu, setKickMenu] = useAtom(kickMenuAtom)
  const [getFollowedLive, setFollowedLive] = useStorage<
    PlatformResponse<PlatformStream>
  >({
    key: "followedLive",
    instance: new Storage({ area: "local" })
  })
  const [userTwitchKey, setUserTwitchKey, { remove: twitchLogout }] =
    useStorage("userTwitchKey")
  console.log(userTwitchKey)
  const [notificationsEnabled, setNotificationsEnabled] = useStorage<boolean>(
    "notificationsEnabled"
  )

  async function getTwitchAuth() {
    const data = await chrome.identity.launchWebAuthFlow({
      interactive: true,
      url: getTwitchOAuthURL()
    })
    const urlObject = new URL(data)
    const fragment = urlObject.hash.substring(1) // Pomiń znak '#'
    const fragmentParams = new URLSearchParams(fragment)
    const clientId = "256lknox4x75bj30rwpctxna2ckbmn"
    const userCredentials = {
      user_id: await getTwitchUserId({
        access_token: fragmentParams.get("access_token"),
        client_id: clientId
      }),
      access_token: fragmentParams.get("access_token"),
      client_id: clientId
    }
    const followedLive = await twitchFetcher([
      `https://api.twitch.tv/helix/streams/followed?user_id=${userCredentials?.user_id}`,
      userCredentials
    ])
    setUserTwitchKey(userCredentials)
    setFollowedLive(followedLive)
  }

  if (kickMenu) return <KickMenuTab />

  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      <div className="flex items-center justify-start w-3/4 space-x-2">
        <Switch
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          checked={notificationsEnabled}
          id="notifications-option"
        />
        <Label htmlFor="notifications-option">Stream Notifications</Label>
      </div>

      {userTwitchKey ? (
        <Button
          className="w-3/4 rounded-md border-0  hover:bg-red-700 bg-zinc-800 text-primary"
          onClick={twitchLogout}>
          Logout of Twitch
        </Button>
      ) : (
        <Button
          className="w-3/4 rounded-md border-0 hover:bg-purple-700 bg-purple-800 text-primary"
          onClick={getTwitchAuth}>
          Login to Twitch
        </Button>
      )}

      <Button
        className="w-3/4 rounded-md border-0 hover:bg-green-700 bg-zinc-800 text-primary"
        disabled={false}
        onClick={() => setKickMenu(true)}>
        Add Kick follows
      </Button>
    </div>
  )
}

export default OptionsTab
