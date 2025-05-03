import { IconUser } from "@tabler/icons-react"
import clsx from "clsx"
import React, { useMemo, useState } from "react"

import { template } from "~src/lib/util/helperFunc"

import type { PlatformStream } from "../lib/types/twitchTypes"
import { cn } from "../lib/util"
import StreamUptime from "./StreamUptime"
import { Skeleton } from "./ui/skeleton"

type Props = {
  stream: PlatformStream
  variant?: "Twitch" | "Kick"
}

const StreamItem = ({
  stream: {
    user_login,
    user_name,
    viewer_count = 0,
    title = "",
    game_name = "",
    thumbnail_url,
    started_at
  },
  variant = "Twitch"
}: Props) => {
  const [loaded, setLoaded] = useState(false)
  const previewImage = useMemo(() => {
    if (!thumbnail_url) return ""

    // For Kick URLs, use them directly
    if (variant === "Kick") return thumbnail_url

    // For Twitch URLs, use the template
    const url = new URL(
      template(thumbnail_url, {
        "{height}": 54,
        "{width}": 96
      })
    )
    return url.href
  }, [thumbnail_url, variant])

  if (thumbnail_url === undefined) return null
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
      <div className="h-[54px] w-[96px] flex items-center rounded-sm relative">
        <img
          src={previewImage}
          alt="stream preview"
          className="h-[54px] w-[96px] max-w-none rounded-sm"
          style={{ display: loaded ? "block" : "none" }}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <Skeleton className={`h-[54px] w-[96px] bg-neutral-700`} />}
        <StreamUptime startedAt={started_at} />
      </div>
      <div className="flex w-full flex-col pl-1.5">
        <div className="flex justify-between">
          <h1 className="text-white text-sm font-bold overflow-ellipsis overflow-hidden w-40">
            {user_name}
          </h1>
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
