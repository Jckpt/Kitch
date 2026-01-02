import type {
    KickLivestreamsResponse,
    KickCategoriesResponse,
    KickChannelsResponse,
    KickUsersResponse
} from "../../types"
import { makeAuthenticatedRequest } from "../../utils"

// Service handle business logic, decoupled from Elysia controller
export abstract class ApiService {
    /**
     * Pobiera livestreamy z Kick API
     * @param category_id - opcjonalne ID kategorii do filtrowania
     * @param token - OAuth token
     * @param clientId - Kick Client ID
     * @param clientSecret - Kick Client Secret
     * @returns Response z Kick API lub error
     */
    static async getLivestreams(
        category_id: string | undefined,
        token: string,
        clientId: string,
        clientSecret: string
    ): Promise<{
        data?: KickLivestreamsResponse
        error?: string
        newToken?: string
    }> {
        try {
            // Buduj URL z parametrami
            let url = "https://api.kick.com/public/v1/livestreams?limit=100&sort=viewer_count"
            if (category_id) {
                url += `&category_id=${category_id}`
            }

            const result = await makeAuthenticatedRequest(
                url,
                token,
                clientId,
                clientSecret
            )

            if (!result.response) {
                return { error: "Failed to fetch data from Kick API" }
            }

            if (result.response.status !== 200) {
                return {
                    error: `Kick API returned status ${result.response.status}`
                }
            }

            const data = (await result.response.json()) as KickLivestreamsResponse

            return {
                data,
                newToken: result.newToken
            }
        } catch (error) {
            console.error("Error in getLivestreams:", error)
            return { error: "An error occurred while fetching livestreams" }
        }
    }

    /**
     * Pobiera kategorie z Kick API
     * @param query - opcjonalny search query
     * @param page - opcjonalny numer strony (nie używany w obecnej implementacji)
     * @param token - OAuth token
     * @param clientId - Kick Client ID
     * @param clientSecret - Kick Client Secret
     * @returns Response z Kick API lub error
     */
    static async getCategories(
        query: string | undefined,
        page: string | undefined,
        token: string,
        clientId: string,
        clientSecret: string
    ): Promise<{
        data?: KickCategoriesResponse
        error?: string
        newToken?: string
    }> {
        try {
            const searchQuery = query !== undefined && query.length > 0 ? query : " "
            let url = `https://api.kick.com/public/v1/categories?q=${encodeURIComponent(searchQuery)}`

            const result = await makeAuthenticatedRequest(
                url,
                token,
                clientId,
                clientSecret
            )

            if (!result.response) {
                return { error: "Failed to fetch data from Kick API" }
            }

            if (result.response.status !== 200) {
                return {
                    error: `Kick API returned status ${result.response.status}`
                }
            }

            const data = (await result.response.json()) as KickCategoriesResponse

            return {
                data,
                newToken: result.newToken
            }
        } catch (error) {
            console.error("Error in getCategories:", error)
            return { error: "An error occurred while fetching categories" }
        }
    }

    /**
     * Pobiera informacje o kanale (streamerze) z Kick API
     * @param streamer - nazwa streamera (slug)
     * @param token - OAuth token
     * @param clientId - Kick Client ID
     * @param clientSecret - Kick Client Secret
     * @returns Username streamera lub error
     */
    static async getChannel(
        streamer: string,
        token: string,
        clientId: string,
        clientSecret: string
    ): Promise<{
        data?: { user: { username: string } }
        error?: string
        newToken?: string
    }> {
        try {
            // Najpierw pobierz user_id z channels API
            const channelsUrl = `https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(
                streamer
            )}`

            const channelsResult = await makeAuthenticatedRequest(
                channelsUrl,
                token,
                clientId,
                clientSecret
            )

            if (!channelsResult.response) {
                return { error: "Failed to fetch channel data from Kick API" }
            }

            if (channelsResult.response.status === 404) {
                return { error: "Channel not found" }
            }

            if (channelsResult.response.status !== 200) {
                return {
                    error: `Kick API returned status ${channelsResult.response.status}`
                }
            }

            const channelsData =
                (await channelsResult.response.json()) as KickChannelsResponse

            if (!channelsData.data || channelsData.data.length === 0) {
                return { error: "Channel not found" }
            }

            const userId = channelsData.data[0].broadcaster_user_id

            // Pobierz username z users API
            const usersUrl = `https://api.kick.com/public/v1/users?id=${userId}`

            const usersResult = await makeAuthenticatedRequest(
                usersUrl,
                token,
                clientId,
                clientSecret
            )

            if (!usersResult.response) {
                return { error: "Failed to fetch user data from Kick API" }
            }

            if (usersResult.response.status !== 200) {
                return {
                    error: `Kick API returned status ${usersResult.response.status}`
                }
            }

            const usersData =
                (await usersResult.response.json()) as KickUsersResponse

            if (!usersData.data || usersData.data.length === 0) {
                return { error: "User not found" }
            }

            const username = usersData.data[0].name

            return {
                data: {
                    user: {
                        username: username
                    }
                },
                newToken: channelsResult.newToken || usersResult.newToken
            }
        } catch (error) {
            console.error("Error in getChannel:", error)
            return { error: "An error occurred while fetching channel data" }
        }
    }
}

