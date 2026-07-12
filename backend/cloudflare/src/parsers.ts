import type { CategoryResponse, ChannelData } from './types'

type KickChannel = ChannelData['data'][number]

export function parsePublicKickStreamObject(kickObject: KickChannel) {
  const parsedKickObject = {
    id: kickObject.broadcaster_user_id || null,
    user_id: kickObject.broadcaster_user_id || null,
    slug: kickObject.slug || null,
    user: { username: kickObject.slug || null },
    livestream: null as null | {
      categories: Array<{
        id: number | string | null
        name: string | null
      }>
      session_title: string | null
      viewer_count: number
      created_at: string | null
      language: string | null
      thumbnail: { url: string | null }
      is_mature: boolean
      is_live: boolean
    }
  }

  if (kickObject.stream && kickObject.stream.is_live) {
    parsedKickObject.livestream = {
      categories: kickObject.category ? [
        {
          id: kickObject.category.id || null,
          name: kickObject.category.name || null,
        }
      ] : [],
      session_title: kickObject.stream_title || null,
      viewer_count: kickObject.stream.viewer_count || 0,
      created_at: kickObject.stream.start_time || null,
      language: kickObject.stream.language || null,
      thumbnail: { url: kickObject.stream.thumbnail || null },
      is_mature: kickObject.stream.is_mature || false,
      is_live: kickObject.stream.is_live || false,
    }
  }

  return parsedKickObject
}

function extractCategoryImage(category: CategoryResponse['data'][number]) {
  const responsiveBanner = category.banner?.responsive

  if (!responsiveBanner) {
    return category.thumbnail || null
  }

  const parts = responsiveBanner.split(', ')
  const selectedPart = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  return selectedPart.replace(/\s\d{2,}w$/, '')
}

export function parseCategoryData(categories: CategoryResponse['data']) {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    box_art_url: extractCategoryImage(category),
  }))
}
