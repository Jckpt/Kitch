import React from "react"

const UserItem = ({
  user: { display_name, game_name, is_live, thumbnail_url, title }
}) => {
  const avatar = thumbnail_url.replace("300x300", "70x70")
  console.log(avatar)
  console.log(display_name, game_name, is_live, thumbnail_url, title)
  return (
    <a
      href={`https://twitch.tv/${display_name}`}
      target="_blank"
      className="flex flex-row p-2 gap-2 items-center hover:bg-neutral-800">
      <div className="relative flex-col">
        <img
          src={avatar}
          className={`rounded-full ${is_live ? "ring-2 ring-red-500" : ""}`}
          width={42}
          height={42}
          loading="lazy"
        />
        <div
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 rounded-sm bg-red-500 text-[10px] flex justify-center items-center ${
            !is_live && "hidden"
          }`}>
          LIVE
        </div>
      </div>
      <div className="flex flex-col items-start">
        <span>{display_name}</span>
        <div
          className="text-gray-400 w-64 overflow-ellipsis overflow-hidden whitespace-nowrap"
          title={title}>
          {title === "" ? "No title" : title}
        </div>
        <div className="text-gray-400">
          {game_name === "" ? "No category" : game_name}
        </div>
      </div>
    </a>
  )
}

export default UserItem
