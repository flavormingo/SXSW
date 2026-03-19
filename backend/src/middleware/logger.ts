import type { Context, Next } from 'hono'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('http')

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now()

  await next()

  const duration = Date.now() - start
  const status = c.res.status

  const logData = {
    method: c.req.method,
    path: c.req.path,
    status,
    duration,
    requestId: c.req.header('x-request-id'),
  }

  if (status >= 500) {
    log.error(logData, 'Request error')
  } else if (status >= 400) {
    log.warn(logData, 'Request warning')
  } else {
    log.info(logData, 'Request completed')
  }
}
