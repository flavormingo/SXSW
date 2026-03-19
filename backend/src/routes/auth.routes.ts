import { Hono } from 'hono'
import { auth } from '@/auth/auth'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('auth-routes')
const authRoutes = new Hono()

authRoutes.all('/*', async (c) => {
  try {
    const response = await auth.handler(c.req.raw)
    return response
  } catch (err) {
    log.error({ err, path: c.req.path, method: c.req.method }, 'BetterAuth handler error')
    return c.json({ error: 'Auth error', details: String(err) }, 500)
  }
})

export { authRoutes }
