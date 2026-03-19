import { Hono } from 'hono'
import { asc } from 'drizzle-orm'
import { db } from '@/db/client'
import { tracks } from '@/db/schema'

const trackRoutes = new Hono()

trackRoutes.get('/', async (c) => {
  const allTracks = await db.select().from(tracks).orderBy(asc(tracks.sortOrder))
  return c.json({ data: allTracks })
})

export { trackRoutes }
