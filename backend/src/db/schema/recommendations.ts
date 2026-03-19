import { pgTable, text, timestamp, boolean, doublePrecision, index, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'
import { events } from './events'

export const userRecommendations = pgTable(
  'user_recommendations',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    score: doublePrecision('score').notNull(),
    reason: text('reason'),
    seen: boolean('seen').notNull().default(false),
    dismissed: boolean('dismissed').notNull().default(false),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.eventId] }),
    index('recommendations_user_score_idx').on(table.userId, table.score),
  ],
)
