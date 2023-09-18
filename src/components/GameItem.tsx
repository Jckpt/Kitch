import React from "react"

const GameItem = ({ game: { name, box_art_url } }) => {
  //convert box_art_url to 600x800
  box_art_url = box_art_url.replace("{width}", "80").replace("{height}", "100")
  return (
    <div>
      <img src={box_art_url} loading="lazy" />
      <div
        className="text-gray-300 w-20 overflow-ellipsis overflow-hidden whitespace-nowrap"
        title={name}>
        {name}
      </div>
    </div>
  )
}

export default GameItem
