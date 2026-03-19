import { readFileSync } from 'fs'
import { sign } from 'crypto'
import { env } from '@/env'
import { createChildLogger } from './logger'

const log = createChildLogger('apns')

interface APNsPayload {
  aps: {
    alert: { title: string; body: string; subtitle?: string }
    sound?: string
    badge?: number
    'thread-id'?: string
    'mutable-content'?: number
  }
  data?: Record<string, unknown>
}

let cachedToken: { token: string; issuedAt: number } | null = null

function generateJWT(): string {
  // Reuse token if less than 50 minutes old (Apple allows 60 min)
  if (cachedToken && Date.now() - cachedToken.issuedAt < 50 * 60 * 1000) {
    return cachedToken.token
  }

  if (!env.APNS_KEY_PATH || !env.APNS_KEY_ID || !env.APNS_TEAM_ID) {
    throw new Error('APNs credentials not configured')
  }

  const key = readFileSync(env.APNS_KEY_PATH, 'utf8')
  const issuedAt = Math.floor(Date.now() / 1000)

  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', kid: env.APNS_KEY_ID }),
  ).toString('base64url')

  const payload = Buffer.from(
    JSON.stringify({ iss: env.APNS_TEAM_ID, iat: issuedAt }),
  ).toString('base64url')

  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), {
    key,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url')

  const token = `${header}.${payload}.${signature}`
  cachedToken = { token, issuedAt: Date.now() }
  return token
}

const APNS_HOST =
  env.APNS_ENVIRONMENT === 'production'
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com'

export async function sendPushNotification(
  deviceToken: string,
  notification: {
    title: string
    body: string
    subtitle?: string
    data?: Record<string, unknown>
    threadId?: string
  },
): Promise<boolean> {
  const jwt = generateJWT()

  const payload: APNsPayload = {
    aps: {
      alert: {
        title: notification.title,
        body: notification.body,
        subtitle: notification.subtitle,
      },
      sound: 'default',
      'thread-id': notification.threadId,
    },
    data: notification.data,
  }

  try {
    const response = await fetch(`${APNS_HOST}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${jwt}`,
        'apns-topic': env.APNS_BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      log.error({ deviceToken: deviceToken.slice(0, 8), status: response.status, error }, 'APNs send failed')
      return false
    }

    return true
  } catch (err) {
    log.error({ err, deviceToken: deviceToken.slice(0, 8) }, 'APNs request error')
    return false
  }
}
