import { Hono } from 'hono'
import { corsMiddleware } from '@/middleware/cors'
import { requestId } from '@/middleware/request-id'
import { requestLogger } from '@/middleware/logger'
import { errorHandler } from '@/middleware/error-handler'
import { mountRoutes } from '@/routes'

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

// Mount all API routes
mountRoutes(app)

// Global error handler
app.onError(errorHandler)

// 404 fallback
app.notFound((c) =>
  c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404),
)

export { app }
