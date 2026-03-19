import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'
import { events } from './events'

export const userFavorites = pgTable(
  'user_favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.eventId] })],
)
