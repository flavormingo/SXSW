import { describe, it, expect } from 'vitest'
import { normalizeEvents } from '../../src/scraper/normalizer'
import type { RawEvent } from '../../src/scraper/parser'

describe('Scraper Normalizer', () => {
  it('normalizes a valid event', () => {
    const raw: RawEvent[] = [
      {
        externalId: 'test-1',
        title: 'AI Panel Discussion',
        description: 'A great panel',
        startTime: '2027-03-14T10:00:00-05:00',
        endTime: '2027-03-14T11:30:00-05:00',
        trackName: 'Interactive',
        eventType: 'panel',
      },
    ]

    const result = normalizeEvents(raw)
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('AI Panel Discussion')
    expect(result[0]!.eventType).toBe('panel')
  })

  it('deduplicates by externalId', () => {
    const raw: RawEvent[] = [
      { externalId: 'dup-1', title: 'Event A', startTime: '2027-03-14T10:00:00Z', endTime: '2027-03-14T11:00:00Z' },
      { externalId: 'dup-1', title: 'Event A Copy', startTime: '2027-03-14T10:00:00Z', endTime: '2027-03-14T11:00:00Z' },
    ]

    const result = normalizeEvents(raw)
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Event A')
  })

  it('rejects events where end is before start', () => {
    const raw: RawEvent[] = [
      { externalId: 'bad-1', title: 'Bad Event', startTime: '2027-03-14T11:00:00Z', endTime: '2027-03-14T10:00:00Z' },
    ]

    const result = normalizeEvents(raw)
    expect(result).toHaveLength(0)
  })

  it('strips empty titles', () => {
    const raw: RawEvent[] = [
      { externalId: 'empty-1', title: '', startTime: '2027-03-14T10:00:00Z', endTime: '2027-03-14T11:00:00Z' },
    ]

    const result = normalizeEvents(raw)
    expect(result).toHaveLength(0)
  })

  it('normalizes event types', () => {
    const raw: RawEvent[] = [
      { externalId: 'type-1', title: 'Show', startTime: '2027-03-14T10:00:00Z', endTime: '2027-03-14T11:00:00Z', eventType: 'Panel Discussion' },
      { externalId: 'type-2', title: 'Party', startTime: '2027-03-14T10:00:00Z', endTime: '2027-03-14T11:00:00Z', eventType: 'Happy Hour' },
      { externalId: 'type-3', title: 'Other', startTime: '2027-03-14T10:00:00Z', endTime: '2027-03-14T11:00:00Z', eventType: 'Unknown Format' },
    ]

    const result = normalizeEvents(raw)
    expect(result[0]!.eventType).toBe('panel')
    expect(result[1]!.eventType).toBe('party')
    expect(result[2]!.eventType).toBe('other')
  })
})
