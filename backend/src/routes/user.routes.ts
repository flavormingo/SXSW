import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/auth/middleware'
import { db } from '@/db/client'
import { users } from '@/db/schema'

const userRoutes = new Hono()

userRoutes.use('/*', requireAuth)

userRoutes.get('/me', async (c) => {
  const userId = c.get('user').id
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return c.json({ data: user[0] ?? null })
})

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
})

userRoutes.patch('/me', zValidator('json', updateSchema), async (c) => {
  const body = c.req.valid('json')
  const userId = c.get('user').id

  const updated = await db
    .update(users)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()

  return c.json({ data: updated[0] })
})

export { userRoutes }
