import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { createId } from './utils'

export const devicePushTokens = pgTable(
  'device_push_tokens',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    platform: text('platform', { enum: ['ios', 'android'] })
      .notNull()
      .default('ios'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('push_tokens_user_id_idx').on(table.userId)],
)
