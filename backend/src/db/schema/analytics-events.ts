import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { createId } from './utils'

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id'),
    eventName: text('event_name').notNull(),
    properties: jsonb('properties').$type<Record<string, unknown>>(),
    sessionId: text('session_id'),
    deviceId: text('device_id'),
    platform: text('platform'),
    appVersion: text('app_version'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('analytics_event_name_idx').on(table.eventName),
    index('analytics_created_at_idx').on(table.createdAt),
  ],
)
