import { atom, useAtom } from "jotai"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "~components/ui/button"

import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import KickMenuTab from "./KickMenuTab"

export const kickMenuAtom = atom<boolean>(false)

const OptionsTab = () => {
  const [kickMenu, setKickMenu] = useAtom(kickMenuAtom)

  const [userTwitchKey, _, { remove: twitchLogout }] =
    useStorage("userTwitchKey")
  const [notificationsEnabled, setNotificationsEnabled] = useStorage<boolean>(
    "notificationsEnabled"
  )

  const twitchLogin = () => {
    const BASE_URL = "https://id.twitch.tv/oauth2/authorize"
    const REDIRECT_URI =
      "https://twiki-backend.fly.dev/twitch/callback&response_type=token&scope=user:read:follows"
    const CLIENT_ID = "256lknox4x75bj30rwpctxna2ckbmn"
    window.open(
      `${BASE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`,
      "_blank"
    )
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
          className="w-3/4 rounded-md hover:border-red-700 hover:bg-red-700 bg-zinc-800 text-primary"
          onClick={twitchLogout}>
          Logout of Twitch
        </Button>
      ) : (
        <Button
          className="w-3/4 rounded-md hover:bg-purple-700 hover:border-purple-700 bg-zinc-800 text-primary"
          onClick={twitchLogin}>
          Login to Twitch
        </Button>
      )}

      <Button
        className="w-3/4 rounded-md hover:bg-green-700 hover:border-green-700 bg-zinc-800 text-primary"
        disabled={false}
        onClick={() => setKickMenu(true)}>
        Add Kick follows
      </Button>
    </div>
  )
}

export default OptionsTab
