import React, { useState } from "react"

import { Skeleton } from "./ui/skeleton"

const GameItem = ({ game: { name, box_art_url } }) => {
  box_art_url = box_art_url.replace("{width}", "80").replace("{height}", "100")
  const [loaded, setLoaded] = useState(false)
  return (
    <div>
      <img
        src={box_art_url}
        style={{ display: loaded ? "block" : "none" }}
        className="rounded-md"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <Skeleton className={`h-[100px] w-[80px] bg-neutral-700`} />}
      <div
        className="text-gray-300 w-20 overflow-ellipsis overflow-hidden whitespace-nowrap"
        title={name}>
        {name}
      </div>
    </div>
  )
}

export default GameItem
