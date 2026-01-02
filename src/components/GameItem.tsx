import { useAtom } from "jotai"
import React, { useMemo, useState } from "react"

import { categoryAtom } from "~src/lib/util"

import type { TwitchGame } from "../lib/types/twitchTypes"
import { Skeleton } from "./ui/skeleton"

type Props = {
  game: TwitchGame
  category: string
}

const GameItem = ({ game }: Props) => {
  const { name, box_art_url, id, thumbnail } = game as any
  
  const gameThumbnail = useMemo(() => {
    // Handle Kick format (direct thumbnail URL)
    if (thumbnail) {
      return thumbnail
    }
    // Handle Twitch format (box_art_url with placeholders)
    if (box_art_url) {
      return box_art_url.replace("{width}x{height}", "80x100")
    }
    // Fallback to empty string
    return ""
  }, [box_art_url, thumbnail])
  const [category, setCategory] = useAtom(categoryAtom)
  const [loaded, setLoaded] = useState(false)
  
  if (category === undefined) return null
  
  // Handle missing data
  if (!name || !gameThumbnail) {
    return null
  }
  
  return (
    <div
      className="p-1 flex max-h-[121px] items-center flex-col hover:cursor-pointer hover:bg-neutral-800"
      onClick={() => setCategory(String(id))}>
      <img
        src={gameThumbnail}
        style={{ display: loaded ? "block" : "none" }}
        className="rounded-md h-[95px] w-[76px]"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <Skeleton className={`h-[95px] w-[76px] bg-neutral-700`} />}
      <div
        className="text-gray-300 w-20 overflow-ellipsis overflow-hidden whitespace-nowrap"
        title={name}>
        {name}
      </div>
    </div>
  )
}

export default GameItem
