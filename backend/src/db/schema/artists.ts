import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { createId } from './utils'

export const artists = pgTable('artists', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  genre: text('genre'),
  socialLinks: jsonb('social_links').$type<{
    website?: string
    instagram?: string
    twitter?: string
    spotify?: string
  }>(),
  externalId: text('external_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Artist = typeof artists.$inferSelect
export type NewArtist = typeof artists.$inferInsert
