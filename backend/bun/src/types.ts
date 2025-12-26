// Typy dla API Kicka

// Token OAuth
export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// Kategoria streamu
export interface KickCategory {
  id: string
  name: string
}

// Dane streamu na żywo
export interface KickStream {
  is_live: boolean
  viewer_count?: number
  start_time?: string
  language?: string
  thumbnail?: string
  is_mature?: boolean
}

// Pojedynczy kanał z API Kicka
export interface KickChannel {
  broadcaster_user_id: string
  slug: string
  stream?: KickStream
  stream_title?: string
  category?: KickCategory
  // Możliwe dodatkowe pola, które mogą być w odpowiedzi
  [key: string]: any
}

// Odpowiedź z API channels
export interface KickChannelsResponse {
  data: KickChannel[]
}

// Dane użytkownika z API users
export interface KickUserData {
  name: string
  user_id: string
}

// Odpowiedź z API users
export interface KickUsersResponse {
  data: KickUserData[]
}

// Wynik funkcji makeAuthenticatedRequest
export interface AuthenticatedRequestResult {
  response: Response | null
  newToken?: string
}

// Wynik funkcji fetchActiveStreamers
export interface FetchActiveStreamersResult {
  streamers: KickChannel[]
  newToken?: string
}
