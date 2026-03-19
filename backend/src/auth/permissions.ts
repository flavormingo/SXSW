import type { Context, Next } from 'hono'
import { ForbiddenError } from '@/lib/errors'

export function requireAdmin(c: Context, next: Next) {
  const user = c.get('user')
  if (user?.role !== 'admin') {
    throw new ForbiddenError('Admin access required')
  }
  return next()
}
