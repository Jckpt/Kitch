export type UserTwitchKey = {
  user_id: string
  access_token: string
  client_id: string
}

export type PlatformStream = {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  type: string
  title: string
  tags: string[]
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tag_ids: string[]
  is_mature: boolean
  platform?: string
}

export type TwitchUser = {
  broadcaster_language: string
  broadcaster_login: string
  display_name: string
  game_id: string
  game_name: string
  id: string
  is_live: boolean
  tag_ids: string[]
  tags: string[]
  thumbnail_url: string
  title: string
  started_at: string
}

export type TwitchGame = {
  id: string
  name: string
  box_art_url: string
}

export interface PlatformResponse<T> {
  data: Array<T>

  pagination: {
    cursor?: string
  }
  platform: string
}
