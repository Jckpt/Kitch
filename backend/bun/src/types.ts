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

// Live stream data
export interface KickStream {
  is_live: boolean
  viewer_count?: number
  start_time?: string
  language?: string
  thumbnail?: string
  is_mature?: boolean
}

// Single channel from Kick API
export interface KickChannel {
  broadcaster_user_id: string
  slug: string
  stream?: KickStream
  stream_title?: string
  category?: KickCategory
  // Possible additional fields that may be in response
  [key: string]: any
}

// Response from channels API
export interface KickChannelsResponse {
  data: KickChannel[]
}

// User data from users API
export interface KickUserData {
  name: string
  user_id: string
}

// Response from users API
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

// Kategoria z thumbnailem (z API categories)
export interface KickCategoryWithThumbnail {
  id: number
  name: string
  thumbnail?: string
  tags?: string[]
  viewer_count?: number
}

// Pojedynczy livestream z API livestreams
export interface KickLivestream {
  broadcaster_user_id: number
  category?: {
    id: number
    name: string
    thumbnail?: string
  }
  channel_id: number
  custom_tags?: string[]
  has_mature_content?: boolean
  language: string
  profile_picture?: string
  slug: string
  started_at: string
  stream_title: string
  thumbnail?: string
  viewer_count: number
}

// Response from livestreams API
export interface KickLivestreamsResponse {
  data: KickLivestream[]
  message?: string
}

// Response from categories API (search)
export interface KickCategoriesResponse {
  data: KickCategoryWithThumbnail[]
  message?: string
}

// Query params dla livestreams
export interface LivestreamQueryParams {
  category_id?: string
  limit?: string
  sort?: string
}

// Query params dla categories
export interface CategoriesQueryParams {
  q?: string
  page?: string
}
