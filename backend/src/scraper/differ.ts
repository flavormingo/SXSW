import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { events, venues, tracks } from '@/db/schema'
import { createChildLogger } from '@/lib/logger'
import type { NormalizedEvent } from './normalizer'

const log = createChildLogger('scraper:differ')

interface Changeset {
  inserts: NormalizedEvent[]
  updates: Array<{ externalId: string; changes: Partial<NormalizedEvent> }>
  venueUpserts: Map<string, { name: string; address?: string }>
  trackUpserts: Set<string>
}

export async function computeChangeset(normalized: NormalizedEvent[]): Promise<Changeset> {
  const changeset: Changeset = {
    inserts: [],
    updates: [],
    venueUpserts: new Map(),
    trackUpserts: new Set(),
  }

  // Collect unique venues and tracks for upsert
  for (const event of normalized) {
    if (event.venueName) {
      changeset.venueUpserts.set(event.venueName, {
        name: event.venueName,
        address: event.venueAddress,
      })
    }
    if (event.trackName) {
      changeset.trackUpserts.add(event.trackName)
    }
  }

  // Fetch existing events by externalId
  const existingEvents = await db.select().from(events)
  const existingByExternalId = new Map(
    existingEvents
      .filter((e) => e.externalId)
      .map((e) => [e.externalId!, e]),
  )

  for (const event of normalized) {
    const existing = existingByExternalId.get(event.externalId)

    if (!existing) {
      changeset.inserts.push(event)
      continue
    }

    // Check if anything changed
    const changes: Partial<NormalizedEvent> = {}
    if (event.title !== existing.title) changes.title = event.title
    if (event.description !== existing.description) changes.description = event.description
    if (event.startTime.getTime() !== existing.startTime.getTime()) changes.startTime = event.startTime
    if (event.endTime.getTime() !== existing.endTime.getTime()) changes.endTime = event.endTime
    if (event.eventType !== existing.eventType) changes.eventType = event.eventType
    if (event.imageUrl !== existing.imageUrl) changes.imageUrl = event.imageUrl

    if (Object.keys(changes).length > 0) {
      changeset.updates.push({ externalId: event.externalId, changes })
    }
  }

  log.info(
    {
      inserts: changeset.inserts.length,
      updates: changeset.updates.length,
      venues: changeset.venueUpserts.size,
      tracks: changeset.trackUpserts.size,
    },
    'Changeset computed',
  )

  return changeset
}

export async function applyChangeset(changeset: Changeset): Promise<{
  eventsCreated: number
  eventsUpdated: number
  venuesCreated: number
}> {
  let venuesCreated = 0

  // 1. Upsert tracks
  const trackMap = new Map<string, string>()
  for (const trackName of changeset.trackUpserts) {
    const slug = trackName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await db.select().from(tracks).where(eq(tracks.slug, slug)).limit(1)

    if (existing[0]) {
      trackMap.set(trackName, existing[0].id)
    } else {
      const [inserted] = await db
        .insert(tracks)
        .values({ name: trackName, slug })
        .returning({ id: tracks.id })
      if (inserted) trackMap.set(trackName, inserted.id)
    }
  }

  // 2. Upsert venues
  const venueMap = new Map<string, string>()
  for (const [name, data] of changeset.venueUpserts) {
    const existing = await db.select().from(venues).where(eq(venues.name, name)).limit(1)

    if (existing[0]) {
      venueMap.set(name, existing[0].id)
    } else {
      const [inserted] = await db
        .insert(venues)
        .values({ name: data.name, address: data.address })
        .returning({ id: venues.id })
      if (inserted) {
        venueMap.set(name, inserted.id)
        venuesCreated++
      }
    }
  }

  // 3. Insert new events
  for (const event of changeset.inserts) {
    const day = event.startTime.toISOString().split('T')[0]!
    await db.insert(events).values({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      day,
      venueId: event.venueName ? venueMap.get(event.venueName) : undefined,
      trackId: event.trackName ? trackMap.get(event.trackName) : undefined,
      eventType: event.eventType,
      speakers: event.speakers,
      imageUrl: event.imageUrl,
      tags: event.tags,
      rsvpUrl: event.rsvpUrl,
      externalId: event.externalId,
      rawData: event as unknown as Record<string, unknown>,
      lastScrapedAt: new Date(),
    })
  }

  // 4. Update existing events
  for (const { externalId, changes } of changeset.updates) {
    const updateData: Record<string, unknown> = {
      ...changes,
      lastScrapedAt: new Date(),
      updatedAt: new Date(),
    }

    await db
      .update(events)
      .set(updateData)
      .where(eq(events.externalId, externalId))
  }

  return {
    eventsCreated: changeset.inserts.length,
    eventsUpdated: changeset.updates.length,
    venuesCreated,
  }
}
