import type { KickEnv } from './env'
import { getKickToken, refreshToken } from './kickAuth'

export async function makeAuthenticatedRequest(
  url: string,
  kickEnv: KickEnv
): Promise<Response> {
  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${await getKickToken(kickEnv)}`
    }
  })

  if (response.status === 401) {
    const newToken = await refreshToken(kickEnv)
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${newToken.token}`
      }
    })
  }

  return response
}
