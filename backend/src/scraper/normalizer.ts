import { z } from 'zod'
import { createChildLogger } from '@/lib/logger'
import type { RawEvent } from './parser'

const log = createChildLogger('scraper:normalizer')

const normalizedEventSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  trackName: z.string().optional(),
  eventType: z
    .enum(['session', 'panel', 'workshop', 'screening', 'performance', 'meetup', 'party', 'other'])
    .default('session'),
  speakers: z
    .array(z.object({ name: z.string(), title: z.string().optional(), photo: z.string().optional() }))
    .optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  rsvpUrl: z.string().url().optional(),
})

export type NormalizedEvent = z.infer<typeof normalizedEventSchema>

const EVENT_TYPE_MAP: Record<string, string> = {
  session: 'session',
  panel: 'panel',
  'panel discussion': 'panel',
  workshop: 'workshop',
  screening: 'screening',
  film: 'screening',
  performance: 'performance',
  music: 'performance',
  showcase: 'performance',
  meetup: 'meetup',
  networking: 'meetup',
  party: 'party',
  'happy hour': 'party',
}

function normalizeEventType(raw?: string): string {
  if (!raw) return 'session'
  const key = raw.toLowerCase().trim()
  return EVENT_TYPE_MAP[key] ?? 'other'
}

function cleanText(text: string | undefined): string | undefined {
  if (!text) return undefined
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
    .trim()
}

export function normalizeEvents(rawEvents: RawEvent[]): NormalizedEvent[] {
  const normalized: NormalizedEvent[] = []
  const seen = new Set<string>()

  for (const raw of rawEvents) {
    // Deduplicate by externalId
    if (!raw.externalId || seen.has(raw.externalId)) {
      if (raw.externalId) log.debug({ externalId: raw.externalId }, 'Skipping duplicate')
      continue
    }
    seen.add(raw.externalId)

    const candidate = {
      externalId: raw.externalId.trim(),
      title: cleanText(raw.title) ?? '',
      description: cleanText(raw.description),
      startTime: raw.startTime,
      endTime: raw.endTime,
      venueName: cleanText(raw.venueName),
      venueAddress: cleanText(raw.venueAddress),
      trackName: cleanText(raw.trackName),
      eventType: normalizeEventType(raw.eventType),
      speakers: raw.speakers,
      imageUrl: raw.imageUrl,
      tags: raw.tags?.map((t) => t.toLowerCase().trim()),
      rsvpUrl: raw.rsvpUrl,
    }

    const result = normalizedEventSchema.safeParse(candidate)
    if (result.success) {
      // Validate time range
      if (result.data.endTime <= result.data.startTime) {
        log.warn({ externalId: raw.externalId }, 'Event end before start, skipping')
        continue
      }
      normalized.push(result.data)
    } else {
      log.warn(
        { externalId: raw.externalId, errors: result.error.flatten() },
        'Event failed validation',
      )
    }
  }

  log.info({ input: rawEvents.length, output: normalized.length }, 'Normalization complete')
  return normalized
}
