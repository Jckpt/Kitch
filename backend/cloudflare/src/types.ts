export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface ChannelData {
  data: Array<{
    broadcaster_user_id: string
    slug: string
    stream?: KickStream
    stream_title?: string
    category?: KickCategory
  }>
}

export interface UserData {
  data: Array<{
    name: string
    user_id: string
  }>
}

export interface CategoryResponse {
  data: Array<{
    id: number | string
    name: string
    thumbnail?: string
    banner?: {
      responsive?: string
    }
  }>
}

export interface KickApiResponse {
  data?: unknown[]
  [key: string]: unknown
}

export interface KickTokenCache {
  token: string
  expiresAt: number
}

export interface KickCategory {
  id?: number | string | null
  name?: string | null
}

export interface KickStream {
  viewer_count?: number | null
  start_time?: string | null
  language?: string | null
  thumbnail?: string | null
  is_mature?: boolean | null
  is_live?: boolean | null
}
