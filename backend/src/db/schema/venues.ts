import { pgTable, text, timestamp, doublePrecision, integer } from 'drizzle-orm/pg-core'
import { createId } from './utils'

export const venues = pgTable('venues', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  address: text('address'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  capacity: integer('capacity'),
  description: text('description'),
  imageUrl: text('image_url'),
  floorMapUrl: text('floor_map_url'),
  neighborhood: text('neighborhood'),
  externalId: text('external_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Venue = typeof venues.$inferSelect
export type NewVenue = typeof venues.$inferInsert
