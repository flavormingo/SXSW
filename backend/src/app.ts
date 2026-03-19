import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { corsMiddleware } from '@/middleware/cors'
import { requestId } from '@/middleware/request-id'
import { requestLogger } from '@/middleware/logger'
import { errorHandler } from '@/middleware/error-handler'
import { mountRoutes } from '@/routes'
import { db } from '@/db/client'
import { users, sessions } from '@/db/schema'

const app = new Hono()

// Global middleware
app.use('*', requestId)
app.use('*', corsMiddleware)
app.use('*', requestLogger)

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: process.uptime(),
  }),
)

// Auth complete page — shown after magic link verification
app.get('/api/auth/auth-complete', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Signed In — SXSW</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafafa; }
        .card { text-align: center; padding: 48px 32px; background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); max-width: 400px; }
        h1 { font-size: 28px; margin: 0 0 8px; }
        p { color: #666; margin: 12px 0; }
        .check { font-size: 48px; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check">✓</div>
        <h1>You're signed in!</h1>
        <p>You can close this tab and return to the SXSW app.</p>
      </div>
    </body>
    </html>
  `)
})

// Poll session — app calls this after sending magic link to check if user verified
app.post('/api/auth/poll-session', async (c) => {
  const body = await c.req.json<{ email: string }>()
  if (!body.email) return c.json({ authenticated: false }, 200)

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1)

  if (!user[0]) return c.json({ authenticated: false }, 200)

  // Find their most recent active session
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, user[0].id))
    .orderBy(desc(sessions.createdAt))
    .limit(1)

  if (!session[0] || session[0].expiresAt < new Date()) {
    return c.json({ authenticated: false }, 200)
  }

  return c.json({
    authenticated: true,
    token: session[0].token,
    user: {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      avatarUrl: user[0].avatarUrl,
      role: user[0].role,
      createdAt: user[0].createdAt,
    },
  })
})

// Mount all API routes
mountRoutes(app)

// Global error handler
app.onError(errorHandler)

// 404 fallback
app.notFound((c) =>
  c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404),
)

export { app }
