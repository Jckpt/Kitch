import React, { useEffect, useState } from 'react'

type Props = {
  startedAt: string
}

const StreamUptime = ({ startedAt }: Props) => {
  const [uptime, setUptime] = useState('')

  useEffect(() => {
    const calculateUptime = () => {
      const now = new Date()
      const start = new Date(startedAt)
      const diffMs = now.getTime() - start.getTime()
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
      
      const padZero = (num: number) => num.toString().padStart(2, '0')
      
      return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`
    }

    setUptime(calculateUptime())
    const interval = setInterval(() => {
      setUptime(calculateUptime())
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 px-1 rounded-tl rounded-br text-xs text-white">
      {uptime}
    </div>
  )
}

export default React.memo(StreamUptime) 