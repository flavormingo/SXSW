import { Hono } from 'hono'
import { auth } from '@/auth/auth'

const authRoutes = new Hono()

// BetterAuth needs the full path — mount at wildcard and pass raw request
authRoutes.all('/*', (c) => {
  return auth.handler(c.req.raw)
})

export { authRoutes }
