const DEFAULT_KICK_API_BASE_URL = "https://kitch.pl"

const configuredKickApiBaseUrl =
  process.env.PLASMO_PUBLIC_KITCH_API_BASE_URL || DEFAULT_KICK_API_BASE_URL

export const KICK_API_BASE_URL = configuredKickApiBaseUrl.replace(/\/$/, "")

export const kickApiUrl = (path: string) => `${KICK_API_BASE_URL}${path}`
