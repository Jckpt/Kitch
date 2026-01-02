import { redis } from "bun"
import { Elysia } from "elysia"

import { tokenManager } from "./auth/tokenManager"
import { api } from "./modules/api"
import { streamers } from "./modules/streamers"
import { StreamersWorker } from "./modules/streamers/worker"

const app = new Elysia().use(api).use(streamers).listen(3000)
console.log("Elysia server created")

redis.send("FLUSHDB", [])

setInterval(async () => {
  const { token, clientId, clientSecret } = tokenManager.getCredentials()
  const newToken = await StreamersWorker.checkAndBroadcastActiveStreamers(
    (topic, message) => app.server?.publish(topic, message),
    token,
    clientId,
    clientSecret
  )
  if (newToken) {
    tokenManager.updateToken(newToken)
  }
}, 60_000)
