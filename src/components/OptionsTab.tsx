import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "~components/ui/button"

const OptionsTab = () => {
  const [userTwitchKey, setUserTwitchKey, { remove: removeTwitch }] =
    useStorage("userTwitchKey")
  const logOutTwitch = () => {
    removeTwitch()
  }
  const logIntoTwitch = () => {
    window.open(
      "https://id.twitch.tv/oauth2/authorize?client_id=256lknox4x75bj30rwpctxna2ckbmn&redirect_uri=https://twiki.space/twitch/callback&response_type=token&scope=user:read:follows",
      "_blank"
    )
  }
  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      {userTwitchKey === undefined ? (
        <Button
          className="w-3/4 bg-purple-600 hover:bg-purple-700"
          onClick={logIntoTwitch}>
          Login to Twitch
        </Button>
      ) : (
        <Button
          className="w-3/4 bg-purple-600 hover:bg-red-600"
          onClick={logOutTwitch}>
          Logout of Twitch
        </Button>
      )}

      <Button
        className="w-3/4 bg-green-600 hover:bg-red-600"
        disabled={true}
        onClick={logOutTwitch}>
        Logout of Kick
      </Button>
    </div>
  )
}

export default OptionsTab
