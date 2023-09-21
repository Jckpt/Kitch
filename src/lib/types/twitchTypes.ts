export type UserTwitchKey = {
  user_id: string
  access_token: string
  client_id: string
}

export type TwitchResponse = {
  data: TwitchStream[]
  pagination: {
    cursor: string
  }
}

export type TwitchStream = {
  id: string
  user_id: string
  user_name: string
  game_id: string
  community_ids: string[]
  type: string
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tag_ids: string[]
}
