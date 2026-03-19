import { pgTable, text, timestamp, boolean, integer, index, jsonb } from 'drizzle-orm/pg-core'
import { venues } from './venues'
import { tracks } from './tracks'
import { createId } from './utils'

export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    title: text('title').notNull(),
    description: text('description'),
    shortDescription: text('short_description'),

    // Scheduling
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    day: text('day').notNull(), // e.g. "2027-03-14"

    // Relations
    venueId: text('venue_id').references(() => venues.id),
    trackId: text('track_id').references(() => tracks.id),

    // Metadata
    eventType: text('event_type', {
      enum: ['session', 'panel', 'workshop', 'screening', 'performance', 'meetup', 'party', 'other'],
    })
      .notNull()
      .default('session'),
    imageUrl: text('image_url'),
    tags: text('tags').array(),
    speakers: jsonb('speakers').$type<Array<{ name: string; title?: string; photo?: string }>>(),
    rsvpUrl: text('rsvp_url'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    capacity: integer('capacity'),
    attendeeCount: integer('attendee_count').notNull().default(0),

    // Scraper tracking
    externalId: text('external_id').unique(),
    rawData: jsonb('raw_data'),
    lastScrapedAt: timestamp('last_scraped_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('events_start_time_idx').on(table.startTime),
    index('events_day_idx').on(table.day),
    index('events_track_id_idx').on(table.trackId),
    index('events_venue_id_idx').on(table.venueId),
    index('events_external_id_idx').on(table.externalId),
  ],
)

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
