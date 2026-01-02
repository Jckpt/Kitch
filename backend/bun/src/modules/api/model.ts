import { t } from "elysia"

export namespace ApiModel {
    // Livestreams query validation
    export const livestreamsQuery = t.Object({
        category_id: t.Optional(t.String())
    })

    export type livestreamsQuery = typeof livestreamsQuery.static

    // Categories query validation
    export const categoriesQuery = t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.String())
    })

    export type categoriesQuery = typeof categoriesQuery.static
}

