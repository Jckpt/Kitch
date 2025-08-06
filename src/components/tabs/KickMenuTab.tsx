import { IconPlus, IconX } from "@tabler/icons-react"
import React, { useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

const KickMenuTab = () => {
  const [kickFollows, setKickFollows] = useStorage<string[]>("kickFollows")
  const [kickNickname, setKickNickname] = useState("")
  const [info, setInfo] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAdd = async (nickname: string) => {
    setKickNickname("")
    if (
      kickFollows !== undefined &&
      (nickname === "" ||
        kickFollows.some(
          (follow) => follow.toLowerCase() == nickname.toLowerCase()
        ))
    ) {
      setInfo("Streamer already added")
      return
    }
    setIsLoading(true)
    try {
      const kickUser = await fetch(`https://kitch.pl/api/channel/${nickname}`)
      if (kickUser === null || kickUser.status !== 200) {
        setInfo("Streamer not found")
        return
      }
      const kickUserData = await kickUser.json()

      nickname = kickUserData.user.username
      if (kickFollows === undefined) {
        setKickFollows([nickname])
      } else {
        setKickFollows([...kickFollows, nickname])
      }
      setInfo("")
      
      // Wyłącz flagę nowego użytkownika po dodaniu pierwszego follow na Kick
      const storage = new Storage()
      await storage.set("isNewUser", false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }
  const handleAddEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd(kickNickname)
    }
  }
  
  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      <div className="w-9/12 flex flex-row items-center justify-center gap-[1px]">
        <Input
          type="input"
          className="w-10/12 rounded-l-md border-0 bg-neutral-800"
          placeholder="Add a Kick streamer"
          value={kickNickname}
          onChange={(e) => setKickNickname(e.target.value)}
          onKeyDown={(e) => handleAddEnter(e)}
        />
        <Button
          className="w-2/12 rounded-r-md border-0 bg-zinc-700 hover:bg-zinc-600 text-primary"
          onClick={() => handleAdd(kickNickname)}
          disabled={isLoading}
          size="icon">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <IconPlus />
          )}
        </Button>
      </div>
      <div className="text-red-500 min-h-[24px]">{info}</div>
      <div className="w-9/12 flex flex-col gap-2 overflow-y-auto max-h-36">
        {kickFollows?.map((followedStreamer) => (
          <div 
            key={followedStreamer}
            className="flex justify-between items-center bg-neutral-800 p-2 rounded-md hover:bg-neutral-700 transition-colors cursor-pointer group"
            onClick={() => setKickFollows(kickFollows.filter((f) => f !== followedStreamer))}
          >
            <span className="text-primary">{followedStreamer}</span>
            <IconX 
              className="w-4 h-4 group-hover:text-red-500 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default KickMenuTab
