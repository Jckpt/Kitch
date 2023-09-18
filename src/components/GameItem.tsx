import React from "react"

const GameItem = ({ game: { name, box_art_url } }) => {
  //convert box_art_url to 600x800
  box_art_url = box_art_url.replace("{width}", "80").replace("{height}", "100")
  return (
    <div>
      {name}
      <img src={box_art_url} />
    </div>
  )
}

export default GameItem
