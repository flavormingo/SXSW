import { cors } from 'hono/cors'
import { env } from '@/env'

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : [env.CORS_ORIGIN, 'sxsw://'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposeHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400,
})
