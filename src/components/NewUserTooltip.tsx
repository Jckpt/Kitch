import { IconArrowLeft } from "@tabler/icons-react"
import React from "react"

interface NewUserTooltipProps {
  isVisible: boolean
}

const NewUserTooltip: React.FC<NewUserTooltipProps> = ({ isVisible }) => {
  if (!isVisible) return null

  return (
    <div className="absolute top-1/2 left-12 transform -translate-y-1/2 flex items-center z-50">
      <IconArrowLeft className="text-white mr-1" size={16} />
      <div className="bg-white text-black text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
        Configure your follows
      </div>
    </div>
  )
}

export default NewUserTooltip