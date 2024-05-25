const express = require("express")
const kickApi = require("./api-kick")

const app = express()
const PORT = 3000

const redis = require("redis")

const redisClient = redis.createClient()

app.get("/api/channel/:streamer", async (req, res) => {
  const { streamer } = req.params

  try {
    // Sprawdź, czy dane są w cache
    console.log(`Checking cache for streamer ${streamer}`)
    redisClient.get(streamer, async (err, cachedData) => {
      if (err) throw err

      if (cachedData) {
        console.log(`Cache hit for streamer ${streamer}`)
        res.json(JSON.parse(cachedData))
      } else {
        // Pobierz dane z API
        const response = await kickApi.getUser(streamer)
        console.log(`Cache miss for streamer ${streamer}`)

        // Zapisz dane do cache
        redisClient.setex(streamer, 180, JSON.stringify(response)) // Cache na godzinę (3600 sekund)

        res.json(response)
      }
    })
  } catch (error) {
    console.error(
      `Error fetching data for streamer ${streamer}:`,
      error.message
    )
    res.status(500).json({ error: "An error occurred while fetching data" })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
