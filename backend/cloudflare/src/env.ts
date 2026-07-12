/// <reference types="@cloudflare/workers-types" />

export interface Env {
  KICK_CLIENT_ID: string
  KICK_CLIENT_SECRET: string
  KICK_TOKEN_CACHE: KVNamespace
  TWITCH_CLIENT_ID: string
  TWITCH_CLIENT_SECRET: string
}

export function getKickEnv(env: Env) {
  const { KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_TOKEN_CACHE } = env

  if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET || !KICK_TOKEN_CACHE) {
    return null
  }

  return { KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_TOKEN_CACHE }
}

export type KickEnv = NonNullable<ReturnType<typeof getKickEnv>>

export function getTwitchEnv(env: Env) {
  const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = env

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    return null
  }

  return { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET }
}

export type TwitchEnv = NonNullable<ReturnType<typeof getTwitchEnv>>
