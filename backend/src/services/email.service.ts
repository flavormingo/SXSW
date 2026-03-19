import { resend } from '@/lib/resend'
import { env } from '@/env'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('email')

export async function sendScheduleDigest(
  email: string,
  events: Array<{ title: string; time: string; venue: string }>,
  day: string,
) {
  const eventListHtml = events
    .map(
      (e) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>${e.title}</strong><br/>
            <span style="color: #666;">${e.time} · ${e.venue}</span>
          </td>
        </tr>
      `,
    )
    .join('')

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: `Your SXSW Schedule for ${day}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
        <h1 style="font-size: 22px;">Your Schedule — ${day}</h1>
        <table width="100%" style="border-collapse: collapse;">
          ${eventListHtml}
        </table>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          Open the SXSW app to view details and get directions.
        </p>
      </div>
    `,
  })

  log.info({ email, day, eventCount: events.length }, 'Schedule digest sent')
}
