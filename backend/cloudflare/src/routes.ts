import type { Context, Hono } from "hono"

import type { Env } from "./env"
import { getKickEnv, getTwitchEnv } from "./env"
import { makeAuthenticatedRequest } from "./kickClient"
import { parseCategoryData, parsePublicKickStreamObject } from "./parsers"
import { exchangeTwitchCode, refreshTwitchToken } from "./twitchAuth"
import type {
  CategoryResponse,
  ChannelData,
  KickApiResponse,
  UserData
} from "./types"

type AppContext = Context<{ Bindings: Env }>
type EndpointResponse = Response | Promise<Response>
type ChannelLookup = Record<
  string,
  ReturnType<typeof parsePublicKickStreamObject> | { error: string }
>

function endpoint(handler: (c: AppContext) => EndpointResponse) {
  return async (c: AppContext) => {
    try {
      return await handler(c)
    } catch (error) {
      console.error("Route error:", error)
      return c.json({ error: "An error occurred while fetching data" }, 500)
    }
  }
}

function chunkList<T>(list: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize))
  }
  return chunks
}

function requireKickEnv(env: Env) {
  const kickEnv = getKickEnv(env)

  if (!kickEnv) {
    throw new Error("Missing Kick API configuration")
  }

  return kickEnv
}

function requireTwitchEnv(env: Env) {
  const twitchEnv = getTwitchEnv(env)

  if (!twitchEnv) {
    throw new Error("Missing Twitch API configuration")
  }

  return twitchEnv
}

async function readStringBodyField(c: AppContext, field: string) {
  const body = await c.req.json<Record<string, unknown>>()
  const value = body[field]

  return typeof value === "string" && value.length > 0 ? value : null
}

async function kickJson<T>(
  url: string,
  kickEnv: NonNullable<ReturnType<typeof getKickEnv>>
) {
  const response = await makeAuthenticatedRequest(url, kickEnv)

  if (!response.ok) {
    throw new Error(`Kick API returned ${response.status} for ${url}`)
  }

  return response.json() as Promise<T>
}

export function registerRoutes(app: Hono<{ Bindings: Env }>) {
  app.get("/", (c) => {
    return c.text("Hono.js API is running!")
  })

  app.get(
    "/api/channel/:streamer",
    endpoint(async (c) => {
      const streamer = c.req.param("streamer")
      const kickEnv = requireKickEnv(c.env)

      const channelsUrl = `https://api.kick.com/public/v1/channels?slug=${streamer}`
      const channelResponse = await makeAuthenticatedRequest(
        channelsUrl,
        kickEnv
      )

      if (channelResponse.status === 404) {
        return c.json({ error: "Channel not found" }, 404)
      }

      if (!channelResponse.ok) {
        throw new Error(
          `Kick API returned ${channelResponse.status} for ${channelsUrl}`
        )
      }

      const channelData = (await channelResponse.json()) as ChannelData

      if (!channelData.data || channelData.data.length === 0) {
        return c.json({ error: "Channel not found" }, 404)
      }

      const userId = channelData.data[0].broadcaster_user_id
      const usersUrl = `https://api.kick.com/public/v1/users?id=${userId}`
      const userData = await kickJson<UserData>(usersUrl, kickEnv)

      if (!userData.data || userData.data.length === 0) {
        return c.json({ error: "User not found" }, 404)
      }

      return c.json({
        user: {
          username: userData.data[0].name
        }
      })
    })
  )

  app.post(
    "/api/twitch/token",
    endpoint(async (c) => {
      const code = await readStringBodyField(c, "code")
      if (!code) {
        return c.json({ error: "Missing authorization code" }, 400)
      }

      return exchangeTwitchCode(code, requireTwitchEnv(c.env))
    })
  )

  app.post(
    "/api/twitch/refresh",
    endpoint(async (c) => {
      const refreshToken = await readStringBodyField(c, "refresh_token")
      if (!refreshToken) {
        return c.json({ error: "Missing refresh token" }, 400)
      }

      return refreshTwitchToken(refreshToken, requireTwitchEnv(c.env))
    })
  )

  app.get(
    "/api/v2/channels",
    endpoint(async (c) => {
      const streamers = c.req.query("streamers")

      if (!streamers) {
        return c.json({ error: "Missing streamers parameter" }, 400)
      }

      const kickEnv = requireKickEnv(c.env)

      const streamersList = streamers.split(",")
      const channelsBySlug: ChannelLookup = {}

      for (const chunk of chunkList(streamersList, 50)) {
        const slugParams = chunk
          .map((streamer) => `slug=${streamer.toLowerCase()}`)
          .join("&")
        const url = `https://api.kick.com/public/v1/channels?${slugParams}`
        const responseData = await kickJson<ChannelData>(url, kickEnv)

        for (const streamerData of responseData.data || []) {
          const streamer = streamerData.slug
          channelsBySlug[streamer.toLowerCase()] =
            parsePublicKickStreamObject(streamerData)
        }

        const responseStreamers = new Set(
          (responseData.data || [])
            .map((data) => data.slug?.toLowerCase())
            .filter(Boolean)
        )

        for (const streamer of chunk) {
          if (!responseStreamers.has(streamer.toLowerCase())) {
            channelsBySlug[streamer.toLowerCase()] = {
              error: "Streamer not found"
            }
          }
        }
      }

      return c.json(channelsBySlug)
    })
  )

  app.get(
    "/api/v2/livestreams",
    endpoint(async (c) => {
      const kickEnv = requireKickEnv(c.env)

      const categoryId = c.req.query("category_id")
      const params = new URLSearchParams({
        limit: "100",
        sort: "viewer_count"
      })

      if (categoryId) {
        params.set("category_id", categoryId)
      }

      const livestreamsData = await kickJson<KickApiResponse>(
        `https://api.kick.com/public/v1/livestreams?${params.toString()}`,
        kickEnv
      )

      return c.json(livestreamsData)
    })
  )

  app.get(
    "/api/v2/categories",
    endpoint(async (c) => {
      const kickEnv = requireKickEnv(c.env)

      const query = c.req.query("query")
      const params = new URLSearchParams({
        limit: "1000"
      })

      if (query) {
        params.append("name", query)
      }

      const categoriesData = await kickJson<KickApiResponse>(
        `https://api.kick.com/public/v2/categories?${params.toString()}`,
        kickEnv
      )

      return c.json(categoriesData)
    })
  )

  app.get(
    "/api/subcategories",
    endpoint(async (c) => {
      const limit = c.req.query("limit") || "1000"
      const kickEnv = requireKickEnv(c.env)

      const normalizedLimit = Math.min(Number(limit) || 1000, 1000)
      const params = new URLSearchParams({
        limit: normalizedLimit.toString()
      })

      const responseData = await kickJson<CategoryResponse>(
        `https://api.kick.com/public/v2/categories?${params.toString()}`,
        kickEnv
      )

      return c.json({
        current_page: 1,
        per_page: normalizedLimit,
        reached_end: true,
        data: parseCategoryData(responseData.data || [])
      })
    })
  )
}
