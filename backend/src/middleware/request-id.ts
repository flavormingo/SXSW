import type { Context, Next } from 'hono'
import { randomUUID } from 'crypto'

export async function requestId(c: Context, next: Next) {
  const id = c.req.header('x-request-id') ?? randomUUID()
  c.header('X-Request-Id', id)
  return next()
}
