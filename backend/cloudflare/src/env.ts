/// <reference types="@cloudflare/workers-types" />

export interface Env {
  KICK_CLIENT_ID: string
  KICK_CLIENT_SECRET: string
  KICK_CLIENT_ID_SECONDARY: string
  KICK_CLIENT_SECRET_SECONDARY: string
  KICK_TOKEN_CACHE: KVNamespace
}

export function getKickEnv(
  env: Env,
  client: "primary" | "secondary" = "primary"
) {
  const KICK_CLIENT_ID = client === "primary"
    ? env.KICK_CLIENT_ID
    : env.KICK_CLIENT_ID_SECONDARY
  const KICK_CLIENT_SECRET = client === "primary"
    ? env.KICK_CLIENT_SECRET
    : env.KICK_CLIENT_SECRET_SECONDARY

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET || !env.KICK_TOKEN_CACHE) {
    return null
  }

  return {
    KICK_CLIENT_ID,
    KICK_CLIENT_SECRET,
    KICK_TOKEN_CACHE: env.KICK_TOKEN_CACHE,
    tokenCacheKey: `kick-access-token-${client}`
  }
}

export type KickEnv = NonNullable<ReturnType<typeof getKickEnv>>
