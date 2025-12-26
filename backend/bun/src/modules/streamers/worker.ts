import { StreamersService } from "./service"

// Worker handle background tasks and scheduled jobs
export abstract class StreamersWorker {
  static async checkAndBroadcastActiveStreamers(
    publishFn: (topic: string, message: string) => void,
    token: string,
    clientId: string,
    clientSecret: string
  ): Promise<string> {
    try {
      const result = await StreamersService.checkActiveStreamers(
        token,
        clientId,
        clientSecret
      )

      // Broadcast updates for active streamers
      if (result.activeStreamers) {
        for (const streamer of result.activeStreamers) {
          const message = JSON.stringify({
            type: "stream_live",
            data: streamer
          })
          publishFn(streamer.slug, message)
        }
      }

      // Broadcast offline status
      if (result.inactiveStreamers) {
        for (const streamer of result.inactiveStreamers) {
          const message = JSON.stringify({
            type: "stream_offline",
            data: { slug: streamer }
          })
          publishFn(streamer, message)
        }
      }

      return result.newToken || token
    } catch (error) {
      console.error("Error checking active streamers:", error)
      return token
    }
  }
}
