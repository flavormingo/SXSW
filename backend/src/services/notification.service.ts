import { eq, and } from 'drizzle-orm'
import { db } from '@/db/client'
import { devicePushTokens } from '@/db/schema'
import { sendPushNotification } from '@/lib/apns'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('notifications')

export async function registerPushToken(userId: string, token: string, platform: 'ios' | 'android' = 'ios') {
  await db
    .insert(devicePushTokens)
    .values({ userId, token, platform })
    .onConflictDoUpdate({
      target: devicePushTokens.token,
      set: { userId, isActive: true, updatedAt: new Date() },
    })
}

export async function deactivateToken(token: string) {
  await db
    .update(devicePushTokens)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(devicePushTokens.token, token))
}

export async function sendNotificationToUser(
  userId: string,
  notification: {
    title: string
    body: string
    subtitle?: string
    data?: Record<string, unknown>
    threadId?: string
  },
) {
  const tokens = await db
    .select()
    .from(devicePushTokens)
    .where(and(eq(devicePushTokens.userId, userId), eq(devicePushTokens.isActive, true)))

  let successCount = 0
  const failedTokens: string[] = []

  for (const { token } of tokens) {
    const success = await sendPushNotification(token, notification)
    if (success) {
      successCount++
    } else {
      failedTokens.push(token)
    }
  }

  // Deactivate tokens that failed (likely unregistered)
  for (const token of failedTokens) {
    await deactivateToken(token)
  }

  log.info(
    { userId, total: tokens.length, success: successCount, failed: failedTokens.length },
    'Push notifications sent',
  )

  return { sent: successCount, failed: failedTokens.length }
}

export async function sendScheduleReminder(
  userId: string,
  eventTitle: string,
  minutesUntil: number,
  eventId: string,
) {
  return sendNotificationToUser(userId, {
    title: 'Upcoming Event',
    body: `${eventTitle} starts in ${minutesUntil} minutes`,
    data: { type: 'schedule_reminder', eventId },
    threadId: `event-${eventId}`,
  })
}
