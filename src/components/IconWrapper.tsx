import React from "react"

const IconWrapper = ({ children }) => {
  return (
    <div className="rounded-lg p-1 flex justify-center items-center hover:bg-zinc-700 hover:cursor-pointer">
      {children}
    </div>
  )
}

export default IconWrapper
