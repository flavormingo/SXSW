import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { createId } from './utils'

export const tracks = pgTable('tracks', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  color: text('color').notNull().default('#000000'),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Track = typeof tracks.$inferSelect
export type NewTrack = typeof tracks.$inferInsert
