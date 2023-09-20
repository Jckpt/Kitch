import React from "react"

const UserItem = ({
  user: { display_name, game_name, is_live, thumbnail_url, title }
}) => {
  const avatar = thumbnail_url
    .replace("{width}", "70")
    .replace("{height}", "70")
  console.log(display_name, game_name, is_live, thumbnail_url, title)
  return (
    <div>
      <img src={avatar} width={70} height={70} loading="lazy" />
      <span>{display_name}</span>
      <div
        className="text-gray-300 w-20 overflow-ellipsis overflow-hidden whitespace-nowrap"
        title={title}>
        {title}
      </div>
      <div>is live? {is_live ? "true" : "false"}</div>
    </div>
  )
}

export default UserItem
