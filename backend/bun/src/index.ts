import { redis } from "bun"
import { Elysia } from "elysia"

import { streamers } from "./modules/streamers"
import { StreamersWorker } from "./modules/streamers/worker"

let KICK_TOKEN = process.env.KICK_API_KEY || ""

const app = new Elysia().use(streamers).listen(3000)
console.log("Elysia server created")

redis.send("FLUSHDB", [])

setInterval(async () => {
  KICK_TOKEN = await StreamersWorker.checkAndBroadcastActiveStreamers(
    (topic, message) => app.server?.publish(topic, message),
    KICK_TOKEN,
    process.env.KICK_CLIENT_ID || "",
    process.env.KICK_CLIENT_SECRET || ""
  )
}, 60_000)
