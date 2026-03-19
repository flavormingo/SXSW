import { eq, and, or, lt, gt } from 'drizzle-orm'
import { db } from '@/db/client'
import { userScheduleItems, events, venues, tracks } from '@/db/schema'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { getEventById } from './event.service'

export interface ConflictResult {
  hasConflict: boolean
  conflictingEvents: Array<{
    id: string
    title: string
    startTime: Date
    endTime: Date
  }>
}

export async function getUserSchedule(userId: string, day?: string) {
  const conditions = [eq(userScheduleItems.userId, userId)]

  if (day) {
    conditions.push(eq(events.day, day))
  }

  const results = await db
    .select({
      scheduleItem: userScheduleItems,
      event: events,
      venueName: venues.name,
      venueAddress: venues.address,
      trackName: tracks.name,
      trackColor: tracks.color,
    })
    .from(userScheduleItems)
    .innerJoin(events, eq(userScheduleItems.eventId, events.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(tracks, eq(events.trackId, tracks.id))
    .where(and(...conditions))
    .orderBy(events.startTime)

  return results.map((r) => ({
    ...r.event,
    notify: r.scheduleItem.notify,
    notifyMinutesBefore: r.scheduleItem.notifyMinutesBefore,
    addedAt: r.scheduleItem.addedAt,
    venue: r.venueName ? { name: r.venueName, address: r.venueAddress } : null,
    track: r.trackName ? { name: r.trackName, color: r.trackColor } : null,
  }))
}

export async function checkConflicts(userId: string, eventId: string): Promise<ConflictResult> {
  const event = await getEventById(eventId)

  // Find overlapping events in user's schedule
  // Two events overlap if: eventA.start < eventB.end AND eventA.end > eventB.start
  const overlapping = await db
    .select({
      id: events.id,
      title: events.title,
      startTime: events.startTime,
      endTime: events.endTime,
    })
    .from(userScheduleItems)
    .innerJoin(events, eq(userScheduleItems.eventId, events.id))
    .where(
      and(
        eq(userScheduleItems.userId, userId),
        lt(events.startTime, event.endTime),
        gt(events.endTime, event.startTime),
      ),
    )

  return {
    hasConflict: overlapping.length > 0,
    conflictingEvents: overlapping,
  }
}

export async function addToSchedule(
  userId: string,
  eventId: string,
  opts: { notify?: boolean; forceAdd?: boolean } = {},
) {
  // Verify event exists
  await getEventById(eventId)

  // Check for conflicts unless force-adding
  if (!opts.forceAdd) {
    const conflicts = await checkConflicts(userId, eventId)
    if (conflicts.hasConflict) {
      throw new ConflictError(
        `Schedule conflict with: ${conflicts.conflictingEvents.map((e) => e.title).join(', ')}`,
      )
    }
  }

  // Upsert to handle duplicate adds gracefully
  await db
    .insert(userScheduleItems)
    .values({
      userId,
      eventId,
      notify: opts.notify ?? true,
    })
    .onConflictDoNothing()

  return getUserSchedule(userId, undefined)
}

export async function removeFromSchedule(userId: string, eventId: string) {
  const result = await db
    .delete(userScheduleItems)
    .where(and(eq(userScheduleItems.userId, userId), eq(userScheduleItems.eventId, eventId)))
    .returning()

  if (result.length === 0) {
    throw new NotFoundError('Schedule item')
  }

  return { removed: true }
}

export async function updateScheduleNotification(
  userId: string,
  eventId: string,
  notify: boolean,
  minutesBefore?: string,
) {
  const updates: Record<string, unknown> = { notify }
  if (minutesBefore) updates.notifyMinutesBefore = minutesBefore

  await db
    .update(userScheduleItems)
    .set(updates)
    .where(and(eq(userScheduleItems.userId, userId), eq(userScheduleItems.eventId, eventId)))
}

export async function getUpcomingScheduleItems(
  minutesAhead: number,
): Promise<
  Array<{
    userId: string
    eventId: string
    eventTitle: string
    startTime: Date
    notifyMinutesBefore: string
  }>
> {
  const now = new Date()
  const horizon = new Date(now.getTime() + minutesAhead * 60 * 1000)

  return db
    .select({
      userId: userScheduleItems.userId,
      eventId: userScheduleItems.eventId,
      eventTitle: events.title,
      startTime: events.startTime,
      notifyMinutesBefore: userScheduleItems.notifyMinutesBefore,
    })
    .from(userScheduleItems)
    .innerJoin(events, eq(userScheduleItems.eventId, events.id))
    .where(
      and(
        eq(userScheduleItems.notify, true),
        gt(events.startTime, now),
        lt(events.startTime, horizon),
      ),
    )
}
