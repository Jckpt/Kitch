import { IconPlus } from "@tabler/icons-react"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"

const KickMenuTab = () => {
  const [kickFollows, setKickFollows] = useStorage<string[]>("kickFollows")
  const [kickNickname, setKickNickname] = useState("")
  console.log(kickFollows)
  console.log(kickNickname)
  const handleAdd = async (nickname: string) => {
    if (nickname === "") return
    setKickNickname("")
    nickname = nickname.toLowerCase()
    if (kickFollows === undefined) {
      setKickFollows([nickname])
    } else {
      if (kickFollows.includes(nickname)) return
      setKickFollows([...kickFollows, nickname])
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
      <div className="max-w-full pl-8 pr-8 flex flex-row gap-2 items-center justify-center flex-wrap">
        {kickFollows?.map((follow) => (
          <Badge
            key={follow}
            className=" hover:bg-red-700 hover:cursor-pointer bg-neutral-800 text-primary"
            onClick={() =>
              setKickFollows(kickFollows.filter((f) => f !== follow))
            }>
            {follow}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default KickMenuTab
