import { redis } from "bun"

import type { KickChannel } from "../../types"
import { fetchActiveStreamers } from "../../utils"

// Service handle business logic, decoupled from Elysia controller
export abstract class StreamersService {
  static activeConnections = 0

  static incrementConnections(): number {
    return ++this.activeConnections
  }

  static decrementConnections(): number {
    return --this.activeConnections
  }

  static getActiveConnections(): number {
    return this.activeConnections
  }

  static async getStreamersTracked(): Promise<object> {
    const allStreamers = await redis.hgetall("count")
    return Object.entries(allStreamers || {}).filter(
      ([_, count]) => parseInt(count as string) > 0
    )
  }

  static async incrementStreamerCount(streamer: string): Promise<void> {
    await redis.hincrby("count", streamer, 1)
  }

  static async decrementStreamerCount(streamer: string): Promise<void> {
    await redis.hincrby("count", streamer, -1)
  }

  static async getActiveStreamersData(
    streamers: string[]
  ): Promise<KickChannel[]> {
    const counts = await redis.hmget("count", ...streamers)

    const activeStreamers = streamers.filter((_, index) => {
      const count = counts[index]
      return count !== null && parseInt(count) > 0
    })

    if (activeStreamers.length === 0) {
      return []
    }

    const streamersData = await redis.hmget("data", ...activeStreamers)
    const activeStreamersData: KickChannel[] = []

    streamersData.forEach((data, index) => {
      if (data) {
        try {
          const parsedData = JSON.parse(data) as KickChannel
          activeStreamersData.push(parsedData)
        } catch (error) {
          console.error(
            `Failed to parse data for ${activeStreamers[index]}:`,
            error
          )
        }
      }
    })

    return activeStreamersData
  }

  static async checkActiveStreamers(
    token: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    newToken?: string
    activeStreamers?: KickChannel[]
    inactiveStreamers?: string[]
  }> {
    const allStreamers = await redis.hgetall("count")

    if (!allStreamers || Object.keys(allStreamers).length === 0) {
      return {}
    }

    const streamersToCheck = Object.entries(allStreamers)
      .filter(([_, count]) => parseInt(count as string) > 0)
      .map(([streamer]) => streamer)

    if (streamersToCheck.length === 0) {
      return {}
    }

    const result = await fetchActiveStreamers(
      streamersToCheck,
      token,
      clientId,
      clientSecret
    )

    const activeStreamers: KickChannel[] = result.streamers

    console.log(
      `Active streamers: ${activeStreamers.length}/${streamersToCheck.length}`
    )

    // Update active streamers data
    for (const streamer of activeStreamers) {
      const streamerDataString = JSON.stringify(streamer)
      const previousData = await redis.hget("data", streamer.slug)

      if (previousData === streamerDataString) {
        continue
      }

      await redis.hset("data", streamer.slug, streamerDataString)
      await redis.send("HEXPIRE", ["data", "300", "FIELDS", "1", streamer.slug])
    }

    // Handle offline streamers
    const activeStreamersSet = new Set(activeStreamers.map((s) => s.slug))
    const inactiveStreamers = streamersToCheck.filter(
      (s) => !activeStreamersSet.has(s)
    )

    for (const streamer of inactiveStreamers) {
      const previousData = await redis.hget("data", streamer)

      if (!previousData) {
        continue
      }

      await redis.hdel("data", streamer)
    }

    return {
      newToken: result.newToken,
      activeStreamers: activeStreamers.length > 0 ? activeStreamers : undefined,
      inactiveStreamers:
        inactiveStreamers.length > 0 ? inactiveStreamers : undefined
    }
  }
}
