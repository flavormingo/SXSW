import { Hono } from 'hono'
import { auth } from '@/auth/auth'

// BetterAuth handles all /api/auth/* routes automatically
const authRoutes = new Hono()

authRoutes.all('/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

export { authRoutes }
