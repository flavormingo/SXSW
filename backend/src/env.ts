import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  MAGIC_LINK_EXPIRY_MINUTES: z.coerce.number().default(15),

  // Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_FROM: z.string().email().default('noreply@sxsw.pizza'),

  // APNs
  APNS_KEY_ID: z.string().length(10).optional(),
  APNS_TEAM_ID: z.string().length(10).optional(),
  APNS_BUNDLE_ID: z.string().default('com.madebysnacks.SXSW'),
  APNS_KEY_PATH: z.string().optional(),
  APNS_ENVIRONMENT: z.enum(['development', 'production']).default('production'),

  // App
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Scraper
  SXSW_SCHEDULE_BASE_URL: z.string().url().default('https://schedule.sxsw.com'),
  SCRAPE_CRON: z.string().default('0 */6 * * *'),
  SCRAPE_RATE_LIMIT_MS: z.coerce.number().default(1000),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export type Env = z.infer<typeof envSchema>
