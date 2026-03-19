import type { Context, Next } from 'hono'
import { RateLimitError } from './errors'

// In-memory rate limiter (swap for Redis in production at scale)
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(opts: { windowMs: number; max: number }) {
  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip') ?? 'unknown'
    const now = Date.now()
    const record = store.get(key)

    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs })
      c.header('X-RateLimit-Limit', String(opts.max))
      c.header('X-RateLimit-Remaining', String(opts.max - 1))
      return next()
    }

    if (record.count >= opts.max) {
      c.header('X-RateLimit-Limit', String(opts.max))
      c.header('X-RateLimit-Remaining', '0')
      c.header('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)))
      throw new RateLimitError()
    }

    record.count++
    c.header('X-RateLimit-Limit', String(opts.max))
    c.header('X-RateLimit-Remaining', String(opts.max - record.count))
    return next()
  }
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store) {
    if (now > record.resetAt) store.delete(key)
  }
}, 60_000)
