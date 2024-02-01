import { IconUser } from "@tabler/icons-react"
import clsx from "clsx"
import React, { useState } from "react"

import type { PlatformStream } from "~lib/types/twitchTypes"
import { cn } from "~lib/util"

import { Skeleton } from "./ui/skeleton"

type Props = {
  stream: PlatformStream
  variant?: "Twitch" | "Kick"
}

const StreamItem = ({
  stream: {
    user_login,
    user_name,
    viewer_count,
    title,
    game_name,
    thumbnail_url
  },
  variant = "Twitch"
}: Props) => {
  const [loaded, setLoaded] = useState(false)
  return (
    <a
      key={user_login}
      href={
        variant === "Twitch"
          ? `https://twitch.tv/${user_login}`
          : `https://kick.com/${user_login}`
      }
      target="_blank"
      rel="noopener noreferrer"
      className="bg-neutral-900 items-center flex justify-start p-2 hover:bg-neutral-800">
      <div className="h-[54px] w-[96px] flex items-center rounded-sm">
        <img
          src={thumbnail_url.replace("{width}x{height}", "96x54")}
          alt="stream preview"
          className="h-[54px] w-[96px] max-w-none rounded-sm"
          style={{ display: loaded ? "block" : "none" }}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <Skeleton className={`h-[54px] w-[96px] bg-neutral-700`} />}
      </div>
      <div className="flex w-full flex-col pl-1.5">
        <div className="flex justify-between">
          <h1 className="text-white text-sm font-bold">{user_name}</h1>
          <div
            className={cn("flex flex-row items-center", {
              "text-red-500": variant === "Twitch",
              "text-green-500": variant === "Kick"
            })}>
            <span className="text-xs">{viewer_count.toLocaleString()}</span>
            <IconUser className="w-3.5 h-3.5" />
          </div>
        </div>
        <div
          className="text-gray-300 w-52 overflow-ellipsis overflow-hidden whitespace-nowrap"
          title={title}>
          {title === "" ? <span className="italic">No title</span> : title}
        </div>
        <div className="text-gray-300 w-52 overflow-ellipsis overflow-hidden whitespace-nowrap">
          {game_name === "" ? (
            <span className="italic">No category</span>
          ) : (
            game_name
          )}
        </div>
      </div>
    </a>
  )
}

export default StreamItem
