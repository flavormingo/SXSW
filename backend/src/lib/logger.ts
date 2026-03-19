import pino from 'pino'
import { env } from '@/env'

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        }
      : undefined,
  base: { service: 'sxsw-api' },
  serializers: pino.stdSerializers,
})

export function createChildLogger(name: string) {
  return logger.child({ module: name })
}
