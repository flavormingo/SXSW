import { serve } from '@hono/node-server'
import { app } from './app'
import { env } from './env'
import { logger } from './lib/logger'

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info(
      { port: info.port, env: env.NODE_ENV },
      `SXSW API running on port ${info.port}`,
    )
  },
)
