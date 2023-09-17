import React from "react"

import { Button } from "~/components/ui/button"

const Login = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full">
      <Button asChild variant="outline">
        <a
          target="_blank"
          href="https://id.twitch.tv/oauth2/authorize?client_id=256lknox4x75bj30rwpctxna2ckbmn&redirect_uri=https://twiki.space/twitch/callback&response_type=token&scope=user:read:follows">
          Login to Twitch
        </a>
      </Button>
    </div>
  )
}

export default Login
