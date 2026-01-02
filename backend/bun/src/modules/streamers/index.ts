import { Elysia } from "elysia"

import { StreamersModel } from "./model"
import { StreamersService } from "./service"

// Controller handle HTTP related eg. routing, request validation
export const streamers = new Elysia()
  .get("/stats", async () => {
    return {
      connections: StreamersService.getActiveConnections(),
      streamers_tracked: await StreamersService.getStreamersTracked()
    }
  })
  .ws("/ws", {
    query: StreamersModel.wsQuery,
    async open(ws) {
      try {
        const { streamers } = ws.data.query

        const connections = StreamersService.incrementConnections()
        console.log(`WebSocket connections: ${connections}`)

        for (const streamer of streamers) {
          await StreamersService.incrementStreamerCount(streamer)
        }

        const activeStreamersData =
          await StreamersService.getActiveStreamersData(streamers)

        // Send individual messages for each active streamer
        for (const streamerData of activeStreamersData) {
          const message = {
            type: "stream_live",
            data: streamerData
          }
          ws.send(JSON.stringify(message))
        }

        streamers.forEach((streamer) => {
          ws.subscribe(streamer)
        })
      } catch (error) {
        console.error("Error in websocket open:", error)
      }
    },
    async close(ws) {
      try {
        const { streamers } = ws.data.query

        StreamersService.decrementConnections()

        for (const streamer of streamers) {
          await StreamersService.decrementStreamerCount(streamer)
        }
      } catch (error) {
        console.error("Error in websocket close:", error)
      }
    }
  })
