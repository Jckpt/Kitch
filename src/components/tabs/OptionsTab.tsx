import { IconLoader2 } from "@tabler/icons-react"
import { atom, useAtom } from "jotai"
import React from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { sendRuntimeMessage } from "~src/lib/util/helperFunc"

import { Button } from "../../components/ui/button"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import KickMenuTab from "./KickMenuTab"

export const kickMenuAtom = atom<boolean>(false)

const OptionsTab = () => {
  const [kickMenu, setKickMenu] = useAtom(kickMenuAtom)
  const [loading] = useStorage("authLoadingKick")
  const [userTwitchKey, _, { remove: twitchLogout }] =
    useStorage("userTwitchKey")
  const [notificationsEnabled, setNotificationsEnabled] = useStorage<boolean>(
    "notificationsEnabled"
  )

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

      <Button
        className="w-3/4 rounded-md border-0  hover:bg-red-700 bg-zinc-800 text-primary"
        onClick={twitchLogout}>
        Logout of Twitch
      </Button>

      <Button
        className="w-3/4 rounded-md border-0 hover:bg-green-700 bg-zinc-800 text-primary"
        disabled={false}
        onClick={() => setKickMenu(true)}>
        Add Kick follows
      </Button>

      <Button
        className="w-3/4 rounded-md border-0 hover:bg-green-700 bg-green-800 text-primary"
        onClick={() => sendRuntimeMessage("authorizeKick")}>
        {loading ? (
          <IconLoader2 className="h-6 w-6 animate-spin" />
        ) : (
          "Login with Kick"
        )}
      </Button>
    </div>
  )
}

export default OptionsTab
