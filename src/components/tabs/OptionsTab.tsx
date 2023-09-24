import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "~components/ui/button"

import { Label } from "../ui/label"
import { Switch } from "../ui/switch"

const OptionsTab = () => {
  const [userTwitchKey, _, { remove: twitchLogout }] =
    useStorage("userTwitchKey")
  const [notificationsEnabled, setNotificationsEnabled] = useStorage<boolean>(
    "notificationsEnabled"
  )
  const twitchLogin = () => {
    const BASE_URL = "https://id.twitch.tv/oauth2/authorize"
    const REDIRECT_URI =
      "https://twiki.space/twitch/callback&response_type=token&scope=user:read:follows"
    const CLIENT_ID = "256lknox4x75bj30rwpctxna2ckbmn"
    window.open(
      `${BASE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`,
      "_blank"
    )
  }
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
          className="w-3/4 hover:border-red-700 hover:bg-red-700 hover:text-white"
          onClick={twitchLogout}>
          Logout of Twitch
        </Button>
      ) : (
        <Button
          className="w-3/4 hover:bg-purple-700 hover:border-purple-700 hover:text-white"
          onClick={twitchLogin}>
          Login to Twitch
        </Button>
      )}

      <Button
        variant="outline"
        className="w-3/4 hover:bg-green-700 hover:border-green-700 hover:text-white"
        disabled={true}
        onClick={twitchLogout}>
        Login to Kick
      </Button>
    </div>
  )
}

export default OptionsTab
