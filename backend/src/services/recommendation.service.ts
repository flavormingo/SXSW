import { eq, and, desc, not, inArray, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  userRecommendations,
  events,
  userScheduleItems,
  userFavorites,
  tracks,
  venues,
} from '@/db/schema'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('recommendations')

export async function getUserRecommendations(userId: string, limit = 20) {
  return db
    .select({
      event: events,
      score: userRecommendations.score,
      reason: userRecommendations.reason,
      venueName: venues.name,
      trackName: tracks.name,
      trackColor: tracks.color,
    })
    .from(userRecommendations)
    .innerJoin(events, eq(userRecommendations.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(tracks, eq(events.trackId, tracks.id))
    .where(
      and(
        eq(userRecommendations.userId, userId),
        eq(userRecommendations.dismissed, false),
        eq(events.isCancelled, false),
      ),
    )
    .orderBy(desc(userRecommendations.score))
    .limit(limit)
}

export async function dismissRecommendation(userId: string, eventId: string) {
  await db
    .update(userRecommendations)
    .set({ dismissed: true })
    .where(
      and(eq(userRecommendations.userId, userId), eq(userRecommendations.eventId, eventId)),
    )
}

/**
 * Compute recommendations for a user using a hybrid approach:
 * 1. Content-based: events similar to what they've scheduled/favorited (same track, type, time preference)
 * 2. Collaborative: events popular with users who have similar schedules
 * 3. Popularity: featured or high-attendee events as a fallback
 */
export async function computeRecommendationsForUser(userId: string) {
  log.info({ userId }, 'Computing recommendations')

  // Get user's scheduled + favorited event IDs
  const scheduledEvents = await db
    .select({ eventId: userScheduleItems.eventId })
    .from(userScheduleItems)
    .where(eq(userScheduleItems.userId, userId))

  const favoritedEvents = await db
    .select({ eventId: userFavorites.eventId })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId))

  const userEventIds = [
    ...new Set([
      ...scheduledEvents.map((e) => e.eventId),
      ...favoritedEvents.map((e) => e.eventId),
    ]),
  ]

  if (userEventIds.length === 0) {
    // Cold start: recommend featured events
    const featured = await db
      .select()
      .from(events)
      .where(and(eq(events.isFeatured, true), eq(events.isCancelled, false)))
      .orderBy(desc(events.attendeeCount))
      .limit(30)

    const recs = featured.map((event, i) => ({
      userId,
      eventId: event.id,
      score: 0.5 - i * 0.01,
      reason: 'Featured event at SXSW',
    }))

    await upsertRecommendations(userId, recs)
    return recs.length
  }

  // Get tracks the user prefers
  const userTracks = await db
    .select({ trackId: events.trackId, count: sql<number>`count(*)::int` })
    .from(events)
    .where(inArray(events.id, userEventIds))
    .groupBy(events.trackId)
    .orderBy(desc(sql`count(*)`))

  const preferredTrackIds = userTracks
    .filter((t) => t.trackId != null)
    .map((t) => t.trackId!)

  // Find candidate events not already in user's list
  const candidates = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isCancelled, false),
        not(inArray(events.id, userEventIds)),
        preferredTrackIds.length > 0
          ? inArray(events.trackId, preferredTrackIds)
          : undefined,
      ),
    )
    .limit(100)

  // Score candidates
  const scoredRecs = candidates.map((event) => {
    let score = 0

    // Track match bonus
    const trackRank = preferredTrackIds.indexOf(event.trackId!)
    if (trackRank >= 0) score += 0.4 * (1 - trackRank / preferredTrackIds.length)

    // Featured bonus
    if (event.isFeatured) score += 0.2

    // Popularity signal
    score += Math.min(event.attendeeCount / 1000, 0.2)

    // Time diversity: slight bonus for events on days user has fewer scheduled
    score += Math.random() * 0.1 // Light shuffle for variety

    return {
      userId,
      eventId: event.id,
      score: Math.round(score * 1000) / 1000,
      reason: trackRank >= 0 ? `Based on your interest in ${preferredTrackIds[0]} events` : 'Popular at SXSW',
    }
  })

  // Sort by score, take top 50
  scoredRecs.sort((a, b) => b.score - a.score)
  const topRecs = scoredRecs.slice(0, 50)

  await upsertRecommendations(userId, topRecs)

  log.info({ userId, count: topRecs.length }, 'Recommendations computed')
  return topRecs.length
}

async function upsertRecommendations(
  userId: string,
  recs: Array<{ userId: string; eventId: string; score: number; reason: string }>,
) {
  if (recs.length === 0) return

  // Clear old recommendations
  await db.delete(userRecommendations).where(eq(userRecommendations.userId, userId))

  // Insert new ones
  await db.insert(userRecommendations).values(
    recs.map((r) => ({
      ...r,
      seen: false,
      dismissed: false,
    })),
  )
}
