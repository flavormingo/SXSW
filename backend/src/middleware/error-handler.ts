import type { Context } from 'hono'
import { AppError } from '@/lib/errors'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('error-handler')

export function errorHandler(err: Error, c: Context) {
  const requestId = c.req.header('x-request-id') ?? 'unknown'

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      log.error({ err, requestId }, err.message)
    } else {
      log.warn({ requestId, code: err.code, status: err.statusCode }, err.message)
    }

    return c.json(
      {
        error: {
          message: err.message,
          code: err.code,
        },
      },
      err.statusCode as 400,
    )
  }

  // Unexpected error
  log.error({ err, requestId }, 'Unhandled error')

  return c.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    500,
  )
}
