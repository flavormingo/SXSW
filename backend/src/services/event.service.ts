import { eq, and, gte, lte, ilike, or, desc, asc, gt, inArray, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { events, venues, tracks } from '@/db/schema'
import { NotFoundError } from '@/lib/errors'
import type { PaginationParams } from '@/lib/pagination'

export interface EventFilters {
  trackId?: string
  venueId?: string
  day?: string
  eventType?: string
  isFeatured?: boolean
  search?: string
  startAfter?: Date
  startBefore?: Date
}

export async function listEvents(filters: EventFilters, pagination: PaginationParams) {
  const conditions = []

  if (filters.trackId) conditions.push(eq(events.trackId, filters.trackId))
  if (filters.venueId) conditions.push(eq(events.venueId, filters.venueId))
  if (filters.day) conditions.push(eq(events.day, filters.day))
  if (filters.eventType) conditions.push(eq(events.eventType, filters.eventType as typeof events.eventType.enumValues[number]))
  if (filters.isFeatured) conditions.push(eq(events.isFeatured, true))
  if (filters.startAfter) conditions.push(gte(events.startTime, filters.startAfter))
  if (filters.startBefore) conditions.push(lte(events.startTime, filters.startBefore))
  if (pagination.cursor) conditions.push(gt(events.id, pagination.cursor))

  // Exclude cancelled by default
  conditions.push(eq(events.isCancelled, false))

  if (filters.search) {
    conditions.push(
      or(
        ilike(events.title, `%${filters.search}%`),
        ilike(events.description, `%${filters.search}%`),
      )!,
    )
  }

  const results = await db
    .select({
      event: events,
      venueName: venues.name,
      venueAddress: venues.address,
      trackName: tracks.name,
      trackColor: tracks.color,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(tracks, eq(events.trackId, tracks.id))
    .where(and(...conditions))
    .orderBy(asc(events.startTime), asc(events.title))
    .limit(pagination.limit + 1) // Fetch one extra for cursor

  const hasMore = results.length > pagination.limit
  const data = hasMore ? results.slice(0, pagination.limit) : results

  return {
    data: data.map((r) => ({
      ...r.event,
      venue: r.venueName ? { name: r.venueName, address: r.venueAddress } : null,
      track: r.trackName ? { name: r.trackName, color: r.trackColor } : null,
    })),
    pagination: {
      nextCursor: hasMore ? data[data.length - 1]?.event.id ?? null : null,
      hasMore,
    },
  }
}

export async function getEventById(id: string) {
  const result = await db
    .select({
      event: events,
      venue: venues,
      trackName: tracks.name,
      trackColor: tracks.color,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(tracks, eq(events.trackId, tracks.id))
    .where(eq(events.id, id))
    .limit(1)

  if (!result[0]) throw new NotFoundError('Event', id)

  const r = result[0]
  return {
    ...r.event,
    venue: r.venue,
    track: r.trackName ? { name: r.trackName, color: r.trackColor } : null,
  }
}

export async function getEventsByIds(ids: string[]) {
  if (ids.length === 0) return []

  return db.select().from(events).where(inArray(events.id, ids))
}

export async function getEventDays() {
  const result = await db
    .selectDistinct({ day: events.day })
    .from(events)
    .where(eq(events.isCancelled, false))
    .orderBy(asc(events.day))

  return result.map((r) => r.day)
}

export async function searchEvents(query: string, limit = 20) {
  return db
    .select({
      id: events.id,
      title: events.title,
      startTime: events.startTime,
      day: events.day,
      eventType: events.eventType,
    })
    .from(events)
    .where(
      and(
        eq(events.isCancelled, false),
        or(
          ilike(events.title, `%${query}%`),
          ilike(events.description, `%${query}%`),
        ),
      ),
    )
    .orderBy(asc(events.startTime))
    .limit(limit)
}

export async function getFeaturedEvents(limit = 10) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.isFeatured, true), eq(events.isCancelled, false)))
    .orderBy(asc(events.startTime))
    .limit(limit)
}

export async function getEventCountByDay() {
  const result = await db
    .select({
      day: events.day,
      count: sql<number>`count(*)::int`,
    })
    .from(events)
    .where(eq(events.isCancelled, false))
    .groupBy(events.day)
    .orderBy(asc(events.day))

  return result
}
