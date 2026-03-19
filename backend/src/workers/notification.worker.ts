import { getUpcomingScheduleItems } from '@/services/schedule.service'
import { sendScheduleReminder } from '@/services/notification.service'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('worker:notifications')

// Track which reminders we've already sent to avoid duplicates
const sentReminders = new Set<string>()

export async function processScheduleReminders() {
  // Look 20 minutes ahead to catch all reminder windows
  const upcoming = await getUpcomingScheduleItems(20)

  let sent = 0

  for (const item of upcoming) {
    const minutesUntil = Math.round(
      (item.startTime.getTime() - Date.now()) / (60 * 1000),
    )

    const notifyAt = parseInt(item.notifyMinutesBefore, 10)

    // Send if we're within the notification window (±2 min tolerance)
    if (Math.abs(minutesUntil - notifyAt) <= 2) {
      const reminderKey = `${item.userId}:${item.eventId}:${item.startTime.toISOString()}`

      if (sentReminders.has(reminderKey)) continue

      try {
        await sendScheduleReminder(item.userId, item.eventTitle, minutesUntil, item.eventId)
        sentReminders.add(reminderKey)
        sent++

        // Clean up old keys (older than 1 hour)
        if (sentReminders.size > 10_000) {
          sentReminders.clear()
        }
      } catch (err) {
        log.error({ err, userId: item.userId, eventId: item.eventId }, 'Failed to send reminder')
      }
    }
  }

  if (sent > 0) {
    log.info({ sent, upcoming: upcoming.length }, 'Processed schedule reminders')
  }
}
