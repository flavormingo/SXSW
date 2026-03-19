import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import * as eventService from '@/services/event.service'
import { paginationSchema } from '@/lib/pagination'

const eventRoutes = new Hono()

const eventFilterSchema = z.object({
  trackId: z.string().optional(),
  venueId: z.string().optional(),
  day: z.string().optional(),
  eventType: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
  ...paginationSchema.shape,
})

eventRoutes.get('/', zValidator('query', eventFilterSchema), async (c) => {
  const query = c.req.valid('query')

  const result = await eventService.listEvents(
    {
      trackId: query.trackId,
      venueId: query.venueId,
      day: query.day,
      eventType: query.eventType,
      isFeatured: query.featured,
      search: query.search,
    },
    { limit: query.limit, cursor: query.cursor },
  )

  return c.json(result)
})

eventRoutes.get('/search', async (c) => {
  const q = c.req.query('q') ?? ''
  if (q.length < 2) return c.json({ data: [] })

  const results = await eventService.searchEvents(q)
  return c.json({ data: results })
})

eventRoutes.get('/days', async (c) => {
  const days = await eventService.getEventDays()
  return c.json({ data: days })
})

eventRoutes.get('/featured', async (c) => {
  const events = await eventService.getFeaturedEvents()
  return c.json({ data: events })
})

eventRoutes.get('/stats', async (c) => {
  const counts = await eventService.getEventCountByDay()
  return c.json({ data: counts })
})

eventRoutes.get('/:id', async (c) => {
  const event = await eventService.getEventById(c.req.param('id'))
  return c.json({ data: event })
})

export { eventRoutes }
