import React from "react"
import GameItem from "./GameItem"
import StreamItem from "./StreamItem"

export const MappedCategories = ({ category, pageArray, listRef }) => {
  return (
    <div ref={listRef} className="overflow-y-auto h-full">
      <div className="grid grid-cols-4 w-full">
        {pageArray?.map((games) => {
          // Defensive check for undefined data
          if (!games || !games.data) {
            return null
          }
          return games.data.map((game) => (
            <GameItem game={game} category={category} key={game.id} />
          ))
        })}
      </div>
    </div>
  )
}

export const MappedStreams = ({ pageArray, listRef, variant }) => {
  return (
    <div ref={listRef} className="overflow-y-auto flex flex-col h-full">
      {pageArray?.map((streams) => {
        // Defensive check for undefined data
        if (!streams || !streams.data) {
          return null
        }
        return streams.data.map((stream) => (
          <StreamItem stream={stream} key={stream.id} variant={variant} />
        ))
      })}
    </div>
  )
}
