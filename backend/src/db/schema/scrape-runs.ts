import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'
import { createId } from './utils'

export const scrapeRuns = pgTable('scrape_runs', {
  id: text('id').primaryKey().$defaultFn(createId),
  status: text('status', { enum: ['running', 'completed', 'failed'] })
    .notNull()
    .default('running'),
  eventsFound: integer('events_found').notNull().default(0),
  eventsCreated: integer('events_created').notNull().default(0),
  eventsUpdated: integer('events_updated').notNull().default(0),
  venuesCreated: integer('venues_created').notNull().default(0),
  errors: jsonb('errors').$type<Array<{ message: string; context?: string }>>(),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export type ScrapeRun = typeof scrapeRuns.$inferSelect
