import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { optionalAuth } from '@/auth/middleware'
import * as analyticsService from '@/services/analytics.service'

const analyticsRoutes = new Hono()

const eventSchema = z.object({
  events: z.array(
    z.object({
      eventName: z.string().max(100),
      properties: z.record(z.unknown()).optional(),
      sessionId: z.string().optional(),
      deviceId: z.string().optional(),
      platform: z.string().optional(),
      appVersion: z.string().optional(),
    }),
  ).max(50),
})

analyticsRoutes.post('/events', optionalAuth, zValidator('json', eventSchema), async (c) => {
  const { events } = c.req.valid('json')
  const userId = c.get('user')?.id

  await analyticsService.trackEvents(
    events.map((e) => ({ ...e, userId })),
  )

  return c.json({ success: true })
})

export { analyticsRoutes }
