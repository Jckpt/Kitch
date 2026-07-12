import type { KickEnv } from './env'
import type { KickTokenCache, TokenResponse } from './types'

const TOKEN_REFRESH_BUFFER_MS = 60_000

const cachedKickTokens = new Map<string, KickTokenCache>()

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

  cachedKickTokens.set(kickEnv.tokenCacheKey, token)
  await kickEnv.KICK_TOKEN_CACHE.put(kickEnv.tokenCacheKey, JSON.stringify(token), {
    expirationTtl: tokenData.expires_in,
  })

  return token
}

export async function getKickToken(kickEnv: KickEnv) {
  const cachedKickToken = cachedKickTokens.get(kickEnv.tokenCacheKey) || null

  if (isTokenValid(cachedKickToken)) {
    return cachedKickToken!.token
  }

  const kvToken = await kickEnv.KICK_TOKEN_CACHE.get<KickTokenCache>(
    kickEnv.tokenCacheKey,
    'json'
  )

  if (isTokenValid(kvToken)) {
    cachedKickTokens.set(kickEnv.tokenCacheKey, kvToken!)
    return kvToken!.token
  }

  return (await refreshToken(kickEnv)).token
}
