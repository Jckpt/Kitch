import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Definicje typów
interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ChannelData {
  data: Array<{
    broadcaster_user_id: string
    slug: string
    [key: string]: any // Dodaj elastyczność dla innych pól
  }>
}

interface UserData {
  data: Array<{
    name: string
    user_id: string
  }>
}

// Typ dla środowiska Cloudflare Workers
interface Env {
  KICK_API_KEY: string
  KICK_CLIENT_ID: string
  KICK_CLIENT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['*'],
}))

// Health check endpoint
app.get('/', (c) => {
  return c.text('Hono.js API is running!')
})

// Funkcja do odświeżania tokenu OAuth
async function refreshToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (response.ok) {
      const tokenData = await response.json() as TokenResponse
      return tokenData.access_token
    }

    console.error('Błąd podczas odświeżania tokenu:', response.status)
    return null
  } catch (error) {
    console.error('Wyjątek podczas odświeżania tokenu:', error)
    return null
  }
}

// Funkcja parsująca dane streamera (dokładna kopia parse_public_kick_stream_object z Python)
function parsePublicKickStreamObject(kickObject: any) {
  const parsedKickObject = {
    id: kickObject.broadcaster_user_id || null,
    user_id: kickObject.broadcaster_user_id || null,
    slug: kickObject.slug || null,
    user: { username: kickObject.slug || null },
    livestream: null as any
  }

  // Sprawdź czy stream istnieje i jest live
  if (kickObject.stream && kickObject.stream.is_live) {
    parsedKickObject.livestream = {
      categories: kickObject.category ? [
        {
          id: kickObject.category.id || null,
          name: kickObject.category.name || null,
        }
      ] : [],
      session_title: kickObject.stream_title || null,
      viewer_count: kickObject.stream.viewer_count || 0,
      created_at: kickObject.stream.start_time || null,
      language: kickObject.stream.language || null,
      thumbnail: { url: kickObject.stream.thumbnail || null },
      is_mature: kickObject.stream.is_mature || false,
      is_live: kickObject.stream.is_live || false,
    }
  }

  return parsedKickObject
}

// Funkcja do wykonywania uwierzytelnionych zapytań
async function makeAuthenticatedRequest(
  url: string,
  token: string,
  clientId: string,
  clientSecret: string
): Promise<Response | null> {
  try {
    let response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    // Jeśli dostajemy 401, spróbuj odświeżyć token
    if (response.status === 401) {
      console.log('Otrzymano błąd 401, próbuję odświeżyć token...')
      const newToken = await refreshToken(clientId, clientSecret)

      if (newToken) {
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        })
        console.log('Zapytanie wykonane ponownie z nowym tokenem')
      }
    }

    return response
  } catch (error) {
    console.error('Błąd podczas wykonywania zapytania:', error)
    return null
  }
}

// Endpoint /api/channel/{streamer} - migrowany z Python FastAPI
app.get('/api/channel/:streamer', async (c) => {
  try {
    const streamer = c.req.param('streamer')
    const { KICK_API_KEY, KICK_CLIENT_ID, KICK_CLIENT_SECRET } = c.env

    if (!KICK_API_KEY || !KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
      console.error('Missing API configuration')
      return c.json({ error: 'Missing API configuration' }, 500)
    }

    // Najpierw pobierz user_id z channels API
    const channelsUrl = `https://api.kick.com/public/v1/channels?slug=${streamer}`
    const channelResponse = await makeAuthenticatedRequest(
      channelsUrl,
      KICK_API_KEY,
      KICK_CLIENT_ID,
      KICK_CLIENT_SECRET
    )

    if (!channelResponse) {
      console.error(`Error fetching channel data for streamer: ${streamer}`)
      return c.json({ error: 'Error fetching data from kick API' }, 500)
    }

    if (channelResponse.status === 404) {
      return c.json({ error: 'Channel not found' }, 404)
    }

    if (channelResponse.status !== 200) {
      console.error(`API returned status ${channelResponse.status} for channel ${streamer}`)
      return c.json({ error: 'Error fetching data from kick API' }, 500)
    }

    const channelData = await channelResponse.json() as ChannelData

    if (!channelData.data || channelData.data.length === 0) {
      return c.json({ error: 'Channel not found' }, 404)
    }

    const userId = channelData.data[0].broadcaster_user_id

    // Pobierz username z users API
    const usersUrl = `https://api.kick.com/public/v1/users?id=${userId}`
    const userResponse = await makeAuthenticatedRequest(
      usersUrl,
      KICK_API_KEY,
      KICK_CLIENT_ID,
      KICK_CLIENT_SECRET
    )

    if (!userResponse) {
      console.error(`Error fetching user data for user_id: ${userId}`)
      return c.json({ error: 'Error fetching user data from kick API' }, 500)
    }

    if (userResponse.status !== 200) {
      console.error(`API returned status ${userResponse.status} for user ${userId}`)
      return c.json({ error: 'Error fetching user data from kick API' }, 500)
    }

    const userData = await userResponse.json() as UserData

    if (!userData.data || userData.data.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const result = {
      user: {
        username: userData.data[0].name
      }
    }

    return c.json(result)

  } catch (error) {
    console.error(`Error fetching data for streamer ${c.req.param('streamer')}:`, error)
    return c.json({ error: 'An error occurred while fetching data' }, 500)
  }
})

// Endpoint /api/v2/channels - migrowany z Python FastAPI
app.get('/api/v2/channels', async (c) => {
  try {
    const streamers = c.req.query('streamers')

    if (!streamers) {
      return c.json({ error: 'Missing streamers parameter' }, 400)
    }

    const { KICK_API_KEY, KICK_CLIENT_ID, KICK_CLIENT_SECRET } = c.env

    if (!KICK_API_KEY || !KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
      console.error('Missing API configuration')
      return c.json({ error: 'Missing API configuration' }, 500)
    }

    const streamersList = streamers.split(',')
    const tempSlugToData: Record<string, any> = {}

    // Funkcja do dzielenia listy na kawałki
    function chunkList<T>(list: T[], chunkSize: number): T[][] {
      const chunks: T[][] = []
      for (let i = 0; i < list.length; i += chunkSize) {
        chunks.push(list.slice(i, i + chunkSize))
      }
      return chunks
    }

    const streamerChunks = chunkList(streamersList, 50)

    // Przetwarzaj każdy kawałek
    for (const chunk of streamerChunks) {
      // Buduj URL z wieloma parametrami slug (max 50)
      const slugParams = chunk.map(streamer => `slug=${streamer.toLowerCase()}`).join('&')
      const url = `https://api.kick.com/public/v1/channels?${slugParams}`

      // Pobierz dane dla aktualnego kawałka
      const response = await makeAuthenticatedRequest(
        url,
        KICK_API_KEY,
        KICK_CLIENT_ID,
        KICK_CLIENT_SECRET
      )

      if (!response) {
        console.error(`Error fetching data from kick API for chunk: ${chunk}`)
        return c.json({ error: `Error fetching data from kick API for chunk: ${chunk}` }, 500)
      }

      if (response.status !== 200) {
        console.error(`API returned status ${response.status} for chunk: ${chunk}`)
        return c.json({ error: `Error fetching data from kick API for chunk: ${chunk}` }, 500)
      }

      const responseData = await response.json() as ChannelData

      // Przetwarzaj dane każdego streamera z odpowiedzi
      for (const streamerData of responseData.data || []) {
        const streamer = streamerData.slug
        const parsedData = parsePublicKickStreamObject(streamerData)
        tempSlugToData[streamer.toLowerCase()] = parsedData
      }

      // Obsłuż nie znalezionych streamerów
      const responseStreamers = new Set(
        (responseData.data || []).map(data => data.slug?.toLowerCase()).filter(Boolean)
      )

      for (const streamer of chunk) {
        if (!responseStreamers.has(streamer.toLowerCase())) {
          const errorData = { error: 'Streamer not found' }
          tempSlugToData[streamer.toLowerCase()] = errorData
        }
      }
    }

    return c.json(tempSlugToData)

  } catch (error) {
    console.error(`Error fetching data for streamers:`, error)
    return c.json({ error: 'An error occurred while fetching data' }, 500)
  }
})

export default app
