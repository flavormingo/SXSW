import { Hono } from 'hono'
import { eq, asc } from 'drizzle-orm'
import { db } from '@/db/client'
import { venues, events } from '@/db/schema'
import { NotFoundError } from '@/lib/errors'

const venueRoutes = new Hono()

venueRoutes.get('/', async (c) => {
  const allVenues = await db.select().from(venues).orderBy(asc(venues.name))
  return c.json({ data: allVenues })
})

venueRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const venue = await db.select().from(venues).where(eq(venues.id, id)).limit(1)

  if (!venue[0]) throw new NotFoundError('Venue', id)

  // Get upcoming events at this venue
  const venueEvents = await db
    .select()
    .from(events)
    .where(eq(events.venueId, id))
    .orderBy(asc(events.startTime))
    .limit(50)

  return c.json({
    data: { ...venue[0], events: venueEvents },
  })
})

export { venueRoutes }
