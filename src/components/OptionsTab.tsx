import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "~components/ui/button"

const OptionsTab = () => {
  const [userTwitchKey, _, { remove: logoutTwitch }] =
    useStorage("userTwitchKey")
  const loginTwitch = () => {
    window.open(
      "https://id.twitch.tv/oauth2/authorize?client_id=256lknox4x75bj30rwpctxna2ckbmn&redirect_uri=https://twiki.space/twitch/callback&response_type=token&scope=user:read:follows",
      "_blank"
    )
  }
  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      {userTwitchKey ? (
        <Button
          variant="outline"
          className="w-3/4  hover:border-red-700 hover:bg-red-700 hover:text-white"
          onClick={logoutTwitch}>
          Logout of Twitch
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-3/4  hover:bg-purple-700 hover:border-purple-700 hover:text-white"
          onClick={loginTwitch}>
          Login to Twitch
        </Button>
      )}

      <Button
        variant="outline"
        className="w-3/4 hover:bg-green-700 hover:border-green-700 hover:text-white"
        disabled={true}
        onClick={logoutTwitch}>
        Login to Kick
      </Button>
    </div>
  )
}

export default OptionsTab
