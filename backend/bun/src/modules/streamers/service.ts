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
    return Object.entries(allStreamers || {})
      .filter(([_, count]) => parseInt(count as string) > 0)
      .map(([streamer, subscribers]) => ({
        streamer,
        subscribers: parseInt(subscribers)
      }))
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

    // Update active streamers data - track only changed ones
    const changedStreamers: KickChannel[] = []

    // Batch fetch all previous data
    const activeSlugs = activeStreamers.map((s) => s.slug)
    const previousDataArray = await redis.hmget("data", ...activeSlugs)

    for (const [index, streamer] of activeStreamers.entries()) {
      const streamerDataString = JSON.stringify(streamer)
      const previousData = previousDataArray[index]

      if (previousData === streamerDataString) {
        continue
      }

      await redis.hset("data", streamer.slug, streamerDataString)
      await redis.send("HEXPIRE", ["data", "300", "FIELDS", "1", streamer.slug])

      // Only add to changed list if data actually changed
      changedStreamers.push(streamer)
    }

    // Handle offline streamers - track only those that were previously online
    const activeStreamersSet = new Set(activeStreamers.map((s) => s.slug))
    const potentiallyInactiveStreamers = streamersToCheck.filter(
      (s) => !activeStreamersSet.has(s)
    )

    const actuallyInactiveStreamers: string[] = []

    if (potentiallyInactiveStreamers.length > 0) {
      // Batch fetch all previous data for potentially inactive streamers
      const previousDataArray = await redis.hmget(
        "data",
        ...potentiallyInactiveStreamers
      )

      for (const [index, streamer] of potentiallyInactiveStreamers.entries()) {
        const previousData = previousDataArray[index]

        if (!previousData) {
          continue
        }

        await redis.hdel("data", streamer)

        // Only add to inactive list if was previously in Redis (changed from online to offline)
        actuallyInactiveStreamers.push(streamer)
      }
    }

    return {
      newToken: result.newToken,
      activeStreamers:
        changedStreamers.length > 0 ? changedStreamers : undefined,
      inactiveStreamers:
        actuallyInactiveStreamers.length > 0
          ? actuallyInactiveStreamers
          : undefined
    }
  }
}
