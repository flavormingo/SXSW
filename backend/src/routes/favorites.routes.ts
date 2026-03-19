import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/auth/middleware'
import { db } from '@/db/client'
import { userFavorites, events, venues, tracks } from '@/db/schema'

const favoritesRoutes = new Hono()

favoritesRoutes.use('/*', requireAuth)

favoritesRoutes.get('/', async (c) => {
  const userId = c.get('user').id

  const results = await db
    .select({
      event: events,
      venueName: venues.name,
      trackName: tracks.name,
      trackColor: tracks.color,
      favoritedAt: userFavorites.createdAt,
    })
    .from(userFavorites)
    .innerJoin(events, eq(userFavorites.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(tracks, eq(events.trackId, tracks.id))
    .where(eq(userFavorites.userId, userId))
    .orderBy(events.startTime)

  return c.json({
    data: results.map((r) => ({
      ...r.event,
      venue: r.venueName ? { name: r.venueName } : null,
      track: r.trackName ? { name: r.trackName, color: r.trackColor } : null,
      favoritedAt: r.favoritedAt,
    })),
  })
})

const addFavoriteSchema = z.object({ eventId: z.string() })

favoritesRoutes.post('/', zValidator('json', addFavoriteSchema), async (c) => {
  const { eventId } = c.req.valid('json')
  await db.insert(userFavorites).values({ userId: c.get('user').id, eventId }).onConflictDoNothing()
  return c.json({ success: true }, 201)
})

favoritesRoutes.delete('/:eventId', async (c) => {
  await db
    .delete(userFavorites)
    .where(and(eq(userFavorites.userId, c.get('user').id), eq(userFavorites.eventId, c.req.param('eventId'))))
  return c.json({ success: true })
})

export { favoritesRoutes }
