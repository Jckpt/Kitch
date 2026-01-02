import { Elysia } from "elysia"

import { tokenManager } from "../../auth/tokenManager"
import { ApiModel } from "./model"
import { ApiService } from "./service"

// Controller handle HTTP related eg. routing, request validation
export const api = new Elysia({ prefix: "/api" })
    .get("/channel/:streamer", async ({ params }) => {
        try {
            const { streamer } = params
            const { token, clientId, clientSecret } = tokenManager.getCredentials()

            const result = await ApiService.getChannel(
                streamer,
                token,
                clientId,
                clientSecret
            )

            // If token was refreshed, update it globally
            if (result.newToken) {
                tokenManager.updateToken(result.newToken)
            }

            if (result.error) {
                return {
                    error: result.error
                }
            }

            // Return raw response
            return result.data
        } catch (error) {
            console.error("Error in /api/channel/:streamer endpoint:", error)
            return {
                error: "An error occurred while fetching channel data"
            }
        }
    })
    .get("/livestreams", async ({ query }) => {
        try {
            const { category_id } = query as ApiModel.livestreamsQuery
            const { token, clientId, clientSecret } = tokenManager.getCredentials()

            const result = await ApiService.getLivestreams(
                category_id,
                token,
                clientId,
                clientSecret
            )

            // If token was refreshed, update it globally
            if (result.newToken) {
                tokenManager.updateToken(result.newToken)
            }

            if (result.error) {
                return {
                    error: result.error
                }
            }

            // Return raw response from Kick API
            return result.data
        } catch (error) {
            console.error("Error in /api/livestreams endpoint:", error)
            return {
                error: "An error occurred while fetching livestreams"
            }
        }
    })
    .get("/categories", async ({ query }) => {
        try {
            const { q, page } = query as ApiModel.categoriesQuery
            const { token, clientId, clientSecret } = tokenManager.getCredentials()

            const result = await ApiService.getCategories(
                q,
                page,
                token,
                clientId,
                clientSecret
            )

            // If token was refreshed, update it globally
            if (result.newToken) {
                tokenManager.updateToken(result.newToken)
            }

            if (result.error) {
                return {
                    error: result.error
                }
            }

            // Return raw response from Kick API
            return result.data
        } catch (error) {
            console.error("Error in /api/categories endpoint:", error)
            return {
                error: "An error occurred while fetching categories"
            }
        }
    })

