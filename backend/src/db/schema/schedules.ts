import { pgTable, text, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'
import { events } from './events'

export const userScheduleItems = pgTable(
  'user_schedule_items',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    notify: boolean('notify').notNull().default(true),
    notifyMinutesBefore: text('notify_minutes_before').notNull().default('15'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.eventId] })],
)

export type UserScheduleItem = typeof userScheduleItems.$inferSelect
export type NewUserScheduleItem = typeof userScheduleItems.$inferInsert
