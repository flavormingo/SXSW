import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '@/auth/middleware'
import * as notificationService from '@/services/notification.service'

const notificationRoutes = new Hono()

notificationRoutes.use('/*', requireAuth)

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']).default('ios'),
})

notificationRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { token, platform } = c.req.valid('json')
  await notificationService.registerPushToken(c.get('user').id, token, platform)
  return c.json({ success: true })
})

notificationRoutes.post('/deactivate', zValidator('json', z.object({ token: z.string() })), async (c) => {
  await notificationService.deactivateToken(c.req.valid('json').token)
  return c.json({ success: true })
})

export { notificationRoutes }
