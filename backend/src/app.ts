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

// Mount all API routes
mountRoutes(app)

// Global error handler
app.onError(errorHandler)

// 404 fallback
app.notFound((c) =>
  c.json({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404),
)

export { app }
