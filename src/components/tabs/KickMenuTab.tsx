import { IconPlus, IconX } from "@tabler/icons-react"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

const KickMenuTab = () => {
  const [kickFollows, setKickFollows] = useStorage<string[]>("kickFollows")
  const [kickNickname, setKickNickname] = useState("")
  const [info, setInfo] = useState("")
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
    } catch (e) {
      console.error(e)
    }
  }
  const handleAddEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd(kickNickname)
    }
  }
  return (
    <div className="flex flex-col h-full gap-4 items-center justify-center">
      <div className="w-full flex flex-row items-center justify-center gap-[1px]">
        <Input
          type="input"
          className="w-7/12 rounded-l-md border-0 bg-neutral-800"
          placeholder="Add a Kick streamer"
          value={kickNickname}
          onChange={(e) => setKickNickname(e.target.value)}
          onKeyDown={(e) => handleAddEnter(e)}
        />
        <Button
          className="w-2/12 rounded-r-md border-0 bg-zinc-700 hover:bg-zinc-600 text-primary"
          onClick={() => handleAdd(kickNickname)}
          size="icon">
          <IconPlus />
        </Button>
      </div>
      <div className="text-red-500 min-h-[24px]">{info}</div>
      <div className="max-w-full pl-8 pr-8 flex flex-row gap-2 items-center justify-center flex-wrap">
        {kickFollows?.map((followedStreamer) => (
          <Badge
            key={followedStreamer}
            className=" hover:bg-red-700 hover:cursor-pointer bg-neutral-800 text-primary flex items-center justify-around gap-1 rounded-md"
            onClick={() =>
              setKickFollows(kickFollows.filter((f) => f !== followedStreamer))
            }>
            {followedStreamer}
            <IconX className="w-2 h-2" />
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default KickMenuTab
