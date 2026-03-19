import { db } from '@/db/client'
import { analyticsEvents } from '@/db/schema'
import { sql, gte, desc } from 'drizzle-orm'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('analytics')

interface AnalyticsEvent {
  userId?: string
  eventName: string
  properties?: Record<string, unknown>
  sessionId?: string
  deviceId?: string
  platform?: string
  appVersion?: string
}

export async function trackEvents(events: AnalyticsEvent[]) {
  if (events.length === 0) return

  await db.insert(analyticsEvents).values(events)

  log.debug({ count: events.length }, 'Analytics events ingested')
}

export async function getEventCounts(since: Date) {
  return db
    .select({
      eventName: analyticsEvents.eventName,
      count: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.eventName)
    .orderBy(desc(sql`count(*)`))
}
