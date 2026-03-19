import * as cheerio from 'cheerio'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('scraper:parser')

export interface RawEvent {
  externalId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  venueName?: string
  venueAddress?: string
  trackName?: string
  eventType?: string
  speakers?: Array<{ name: string; title?: string; photo?: string }>
  imageUrl?: string
  tags?: string[]
  rsvpUrl?: string
}

/**
 * Parse SXSW schedule data from various formats.
 * Handles both JSON API responses and HTML pages.
 */
export function parseScheduleData(content: string): RawEvent[] {
  // Try JSON first
  try {
    const data = JSON.parse(content)
    return parseJSONSchedule(data)
  } catch {
    // Not JSON — parse as HTML
    return parseHTMLSchedule(content)
  }
}

function parseJSONSchedule(data: unknown): RawEvent[] {
  const events: RawEvent[] = []

  // Handle common SXSW API shapes
  const items = Array.isArray(data) ? data : (data as Record<string, unknown>)?.events ?? (data as Record<string, unknown>)?.data ?? []

  if (!Array.isArray(items)) {
    log.warn('Unexpected JSON structure, no events array found')
    return []
  }

  for (const item of items) {
    try {
      const raw = item as Record<string, unknown>
      events.push({
        externalId: String(raw.id ?? raw.event_id ?? raw.slug ?? ''),
        title: String(raw.title ?? raw.name ?? ''),
        description: raw.description as string | undefined,
        startTime: String(raw.start_time ?? raw.startTime ?? raw.start ?? ''),
        endTime: String(raw.end_time ?? raw.endTime ?? raw.end ?? ''),
        venueName: raw.venue_name as string ?? (raw.venue as Record<string, unknown>)?.name as string,
        venueAddress: raw.venue_address as string ?? (raw.venue as Record<string, unknown>)?.address as string,
        trackName: raw.track as string ?? raw.category as string,
        eventType: raw.event_type as string ?? raw.type as string,
        speakers: parseSpeakers(raw.speakers ?? raw.panelists),
        imageUrl: raw.image_url as string ?? raw.photo as string,
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : undefined,
        rsvpUrl: raw.rsvp_url as string ?? raw.url as string,
      })
    } catch (err) {
      log.warn({ err, item }, 'Failed to parse JSON event item')
    }
  }

  log.info({ count: events.length }, 'Parsed JSON schedule')
  return events
}

function parseHTMLSchedule(html: string): RawEvent[] {
  const $ = cheerio.load(html)
  const events: RawEvent[] = []

  // Common SXSW HTML patterns — adapt selectors to actual page structure
  const selectors = [
    '.event-card',       // Card layout
    '.schedule-item',    // Schedule list
    '[data-event-id]',   // Data attribute pattern
    '.event-listing',    // Listing layout
  ]

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      try {
        const $el = $(el)
        events.push({
          externalId:
            $el.attr('data-event-id') ??
            $el.attr('data-id') ??
            $el.find('a').first().attr('href')?.split('/').pop() ??
            '',
          title: $el.find('.event-title, .title, h3, h4').first().text().trim(),
          description: $el.find('.event-description, .description, .summary').first().text().trim() || undefined,
          startTime: $el.attr('data-start') ?? $el.find('[data-start], time').first().attr('datetime') ?? '',
          endTime: $el.attr('data-end') ?? $el.find('[data-end]').first().attr('datetime') ?? '',
          venueName: $el.find('.venue-name, .venue, .location').first().text().trim() || undefined,
          trackName: $el.find('.track, .category, .badge').first().text().trim() || undefined,
          eventType: $el.attr('data-type') ?? ($el.find('.event-type').first().text().trim() || undefined),
          imageUrl: $el.find('img').first().attr('src') || undefined,
        })
      } catch (err) {
        log.warn({ err }, 'Failed to parse HTML event element')
      }
    })

    if (events.length > 0) break // Use first matching selector pattern
  }

  log.info({ count: events.length }, 'Parsed HTML schedule')
  return events
}

function parseSpeakers(raw: unknown): Array<{ name: string; title?: string; photo?: string }> | undefined {
  if (!Array.isArray(raw)) return undefined

  return raw
    .map((s) => {
      if (typeof s === 'string') return { name: s }
      const speaker = s as Record<string, unknown>
      return {
        name: String(speaker.name ?? speaker.full_name ?? ''),
        title: speaker.title as string | undefined,
        photo: speaker.photo as string ?? speaker.image as string,
      }
    })
    .filter((s) => s.name.length > 0)
}
