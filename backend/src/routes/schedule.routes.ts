import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '@/auth/middleware'
import * as scheduleService from '@/services/schedule.service'

const scheduleRoutes = new Hono()

// All schedule routes require auth
scheduleRoutes.use('/*', requireAuth)

scheduleRoutes.get('/', async (c) => {
  const day = c.req.query('day')
  const schedule = await scheduleService.getUserSchedule(c.get('user').id, day)
  return c.json({ data: schedule })
})

const addSchema = z.object({
  eventId: z.string(),
  notify: z.boolean().optional(),
  forceAdd: z.boolean().optional(),
})

scheduleRoutes.post('/', zValidator('json', addSchema), async (c) => {
  const body = c.req.valid('json')
  const schedule = await scheduleService.addToSchedule(c.get('user').id, body.eventId, {
    notify: body.notify,
    forceAdd: body.forceAdd,
  })
  return c.json({ data: schedule }, 201)
})

scheduleRoutes.get('/conflicts/:eventId', async (c) => {
  const result = await scheduleService.checkConflicts(c.get('user').id, c.req.param('eventId'))
  return c.json({ data: result })
})

scheduleRoutes.delete('/:eventId', async (c) => {
  await scheduleService.removeFromSchedule(c.get('user').id, c.req.param('eventId'))
  return c.json({ success: true })
})

const updateNotifySchema = z.object({
  notify: z.boolean(),
  minutesBefore: z.string().optional(),
})

scheduleRoutes.patch('/:eventId/notify', zValidator('json', updateNotifySchema), async (c) => {
  const body = c.req.valid('json')
  await scheduleService.updateScheduleNotification(
    c.get('user').id,
    c.req.param('eventId'),
    body.notify,
    body.minutesBefore,
  )
  return c.json({ success: true })
})

export { scheduleRoutes }
