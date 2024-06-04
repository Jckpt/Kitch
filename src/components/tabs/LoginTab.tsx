import { IconLoader2 } from "@tabler/icons-react"
import logo from "data-base64:../../../assets/icon.png"
import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "../../components/ui/button"
import { sendRuntimeMessage } from "../../lib/util/helperFunc"

const LoginTab = () => {
  const [loading] = useStorage("authLoading")
  return (
    <div className="flex h-full flex-col justify-center items-center gap-16">
      <img src={logo} alt="logo" className="w-24 h-24" />
      <Button
        className="w-3/4 rounded-md border-0 hover:bg-purple-700 bg-purple-800 text-primary"
        onClick={() => sendRuntimeMessage("authorize")}>
        {loading ? (
          <IconLoader2 className="h-6 w-6 animate-spin" />
        ) : (
          "Login with Twitch"
        )}
      </Button>
    </div>
  )
}

export default LoginTab
