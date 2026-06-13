import type { KickEnv } from './env'
import type { KickTokenCache, TokenResponse } from './types'

const KICK_TOKEN_CACHE_KEY = 'kick-access-token'
const TOKEN_REFRESH_BUFFER_MS = 60_000

let cachedKickToken: KickTokenCache | null = null

function isTokenValid(token: KickTokenCache | null) {
  return Boolean(
    token?.token &&
      token.expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()
  )
}

export async function refreshToken(kickEnv: KickEnv): Promise<KickTokenCache> {
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: kickEnv.KICK_CLIENT_ID,
      client_secret: kickEnv.KICK_CLIENT_SECRET
    })
  })

  if (!response.ok) {
    throw new Error(`Could not refresh Kick token: ${response.status}`)
  }

  const tokenData = await response.json() as TokenResponse
  const token = {
    token: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  }

  cachedKickToken = token
  await kickEnv.KICK_TOKEN_CACHE.put(KICK_TOKEN_CACHE_KEY, JSON.stringify(token), {
    expirationTtl: tokenData.expires_in,
  })

  return token
}

export async function getKickToken(kickEnv: KickEnv) {
  if (isTokenValid(cachedKickToken)) {
    return cachedKickToken!.token
  }

  const kvToken = await kickEnv.KICK_TOKEN_CACHE.get<KickTokenCache>(
    KICK_TOKEN_CACHE_KEY,
    'json'
  )

  if (isTokenValid(kvToken)) {
    cachedKickToken = kvToken
    return kvToken!.token
  }

  return (await refreshToken(kickEnv)).token
}
