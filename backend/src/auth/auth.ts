import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db/client'
import { env } from '@/env'
import { resend } from '@/lib/resend'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('auth')

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: false, // Magic link only
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Refresh session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cookie cache
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        log.info({ email }, 'Sending magic link')

        await resend.emails.send({
          from: env.EMAIL_FROM,
          to: email,
          subject: 'Sign in to SXSW',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">SXSW</h1>
              <p style="color: #666; margin-bottom: 32px;">Tap the button below to sign in to your account.</p>
              <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Sign In
              </a>
              <p style="color: #999; font-size: 13px; margin-top: 32px;">
                This link expires in ${env.MAGIC_LINK_EXPIRY_MINUTES} minutes. If you didn't request this, ignore this email.
              </p>
            </div>
          `,
        })
      },
      expiresIn: env.MAGIC_LINK_EXPIRY_MINUTES * 60,
    }),
  ],

  trustedOrigins: [env.CORS_ORIGIN, 'sxsw://'],
})

export type Auth = typeof auth
