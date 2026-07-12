import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { Env } from './env'
import { registerRoutes } from './routes'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['*'],
}))

registerRoutes(app)

export default app
