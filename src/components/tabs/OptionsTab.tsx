import { IconLoader2 } from "@tabler/icons-react"
import { atom, useAtom } from "jotai"
import React, { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import { sendRuntimeMessage } from "~src/lib/util/helperFunc"

import { Button } from "../../components/ui/button"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import KickMenuTab from "./KickMenuTab"

export const kickMenuAtom = atom<boolean>(false)

const OptionsTab = () => {
  const storage = new Storage()
  const localStorageInstance = new Storage({ area: "local" })
  const [kickMenu, setKickMenu] = useAtom(kickMenuAtom)
  const [userTwitchKey, setUserTwitchKey] = useState<string>()
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [twitchKey, notifications] = await Promise.all([
        storage.get("userTwitchKey"),
        storage.get<boolean>("notificationsEnabled")
      ])
      
      setUserTwitchKey(twitchKey)
      setNotificationsEnabled(notifications)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const handleNotificationsToggle = async () => {
    const newValue = !notificationsEnabled
    await storage.set("notificationsEnabled", newValue)
    setNotificationsEnabled(newValue)
  }

  const handleTwitchLogout = async () => {
    await storage.remove("userTwitchKey")
    await localStorageInstance.remove("followedLive")
    setUserTwitchKey(undefined)
    sendRuntimeMessage("logout")
  }

  if (kickMenu) return <KickMenuTab />

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      <div className="flex items-center justify-start w-3/4 space-x-2">
        <Switch
          onClick={handleNotificationsToggle}
          checked={notificationsEnabled}
          id="notifications-option"
        />
        <Label htmlFor="notifications-option">Stream notifications</Label>
      </div>
      {userTwitchKey ? (
        <Button
          className="w-3/4 rounded-md border-0  hover:bg-red-700 bg-zinc-800 text-primary"
          onClick={handleTwitchLogout}>
          Logout of Twitch
        </Button>
      ) : (
        <Button
          className="w-3/4 rounded-md border-0 hover:bg-purple-800 bg-purple-700 text-primary"
          onClick={() => sendRuntimeMessage("authorize")}>
          Login with Twitch
        </Button>
      )}
      <Button
        className="w-3/4 rounded-md border-0 hover:bg-green-800 bg-green-700 text-primary"
        disabled={false}
        onClick={() => setKickMenu(true)}>
        Add Kick follows
      </Button>
    </div>
  )
}

export default OptionsTab
