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
      <div className="w-full flex flex-row gap-2 items-center justify-center">
        <Input
          type="input"
          className="w-3/5 border-0 bg-neutral-800"
          placeholder="Add streamer"
          value={kickNickname}
          onChange={(e) => setKickNickname(e.target.value)}
          onKeyDown={(e) => handleAddEnter(e)}
        />
        <Button
          className="w-1/6 border-0 hover:bg-green-700 hover:text-white"
          onClick={() => handleAdd(kickNickname)}>
          <IconPlus />
        </Button>
      </div>
      <div className="w-full flex flex-row gap-2 items-center justify-center">
        {kickFollows?.map((follow) => (
          <Badge
            key={follow}
            className=" hover:bg-red-700 hover:cursor-pointer hover:text-primary bg-primary text-primary-foreground"
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
