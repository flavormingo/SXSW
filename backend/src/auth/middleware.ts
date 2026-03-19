import type { Context, Next } from 'hono'
import { auth } from './auth'
import { UnauthorizedError } from '@/lib/errors'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: string
}

// Declare the variables we attach to the Hono context
declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser
    session: { id: string; userId: string; expiresAt: Date }
  }
}

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session?.user) {
    throw new UnauthorizedError('Valid session required')
  }

  c.set('user', {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as Record<string, unknown>).role as string ?? 'user',
  })

  c.set('session', {
    id: session.session.id,
    userId: session.session.userId,
    expiresAt: session.session.expiresAt,
  })

  return next()
}

export async function optionalAuth(c: Context, next: Next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (session?.user) {
      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as Record<string, unknown>).role as string ?? 'user',
      })
    }
  } catch {
    // Continue without auth
  }

  return next()
}
