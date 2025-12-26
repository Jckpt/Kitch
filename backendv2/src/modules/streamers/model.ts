import { t } from "elysia"

export namespace StreamersModel {
  // WebSocket query validation
  export const wsQuery = t.Object({
    streamers: t.Array(t.String())
  })

  export type wsQuery = typeof wsQuery.static

  // Stats response
  export const statsResponse = t.Object({
    active_connections: t.Number(),
    streamers_tracked: t.Number()
  })

  export type statsResponse = typeof statsResponse.static
}
