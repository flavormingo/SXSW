import { Hono } from 'hono'
import { desc } from 'drizzle-orm'
import { requireAuth } from '@/auth/middleware'
import { requireAdmin } from '@/auth/permissions'
import { db } from '@/db/client'
import { scrapeRuns, events, users } from '@/db/schema'
import { runScrapePipeline } from '@/scraper'
import { sql } from 'drizzle-orm'

const adminRoutes = new Hono()

adminRoutes.use('/*', requireAuth, requireAdmin)

adminRoutes.post('/scrape', async (c) => {
  // Fire and forget — scraper runs in the background
  runScrapePipeline().catch(() => {})
  return c.json({ message: 'Scrape started' })
})

adminRoutes.get('/scrape-runs', async (c) => {
  const runs = await db
    .select()
    .from(scrapeRuns)
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(20)

  return c.json({ data: runs })
})

adminRoutes.get('/stats', async (c) => {
  const [eventCount] = await db.select({ count: sql<number>`count(*)::int` }).from(events)
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users)

  return c.json({
    data: {
      events: eventCount?.count ?? 0,
      users: userCount?.count ?? 0,
    },
  })
})

export { adminRoutes }
