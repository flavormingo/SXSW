import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import dotenv from 'dotenv'

dotenv.config()

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sql })

async function clear() {
  console.log('Clearing old data...')
  await db.execute('DELETE FROM user_schedule_items')
  await db.execute('DELETE FROM user_favorites')
  await db.execute('DELETE FROM user_recommendations')
  await db.execute('DELETE FROM events')
  await db.execute('DELETE FROM venues')
  await db.execute('DELETE FROM tracks')
  console.log('Done — database cleared.')
}

clear().catch(console.error)
