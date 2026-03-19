/**
 * SXSW 2026 Schedule Scraper
 *
 * Scrapes all events from schedule.sxsw.com using Playwright.
 * Uses "Next" button pagination (60 events per page).
 * Enriches each event with og:description from detail pages.
 * Writes everything to Neon.
 *
 * Run: npx tsx src/scraper/scrape-sxsw.ts
 */

import { chromium, type Page } from 'playwright'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

import { events, venues, tracks } from '@/db/schema'

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle({ client: sqlClient })

interface ScrapedEvent {
  externalId: string
  title: string
  description: string | null
  imageUrl: string | null
  date: string
  startTime: string
  endTime: string
  venue: string
  eventType: string
  track: string | null
  presentedBy: string | null
  detailUrl: string
}

const CONCURRENCY = 10

async function main() {
  console.log('Starting SXSW schedule scrape...\n')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })

  await page.goto('https://schedule.sxsw.com/2026/search/event', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })

  try { await page.click('button:has-text("Accept")', { timeout: 3000 }) } catch {}
  await page.waitForSelector('a[href*="/events/"]', { timeout: 15000 })
  await page.waitForTimeout(2000)

  const totalText = await page.evaluate(() =>
    document.body.innerText.match(/SHOWING\s+(\d+)\s+RESULTS/i)?.[1]
  )
  console.log(`Total on SXSW: ${totalText}\n`)

  const allEvents: ScrapedEvent[] = []
  let pageNum = 1

  while (true) {
    const pageEvents = await extractEventsFromPage(page)
    allEvents.push(...pageEvents)
    console.log(`Page ${pageNum}: ${pageEvents.length} events (${allEvents.length} total)`)

    if (pageEvents.length < 10) {
      console.log('Last page reached.')
      break
    }

    try {
      const nextButton = page.locator('button:has-text("Next")')
      if (await nextButton.count() === 0 || await nextButton.isDisabled()) break

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await nextButton.click({ timeout: 5000, force: true })
      await page.waitForTimeout(2000)
      await page.waitForSelector('a[href*="/events/"]', { timeout: 10000 })
    } catch {
      console.log('Pagination ended.')
      break
    }

    pageNum++
  }

  await browser.close()

  // Dedup
  const seen = new Set<string>()
  const unique = allEvents.filter(e => {
    if (seen.has(e.externalId)) return false
    seen.add(e.externalId)
    return true
  })
  console.log(`\nScraped: ${allEvents.length}, Unique: ${unique.length}`)

  // Enrich
  console.log('\nFetching descriptions...')
  await enrichDescriptions(unique)

  // Write
  console.log('\nWriting to database...')
  await writeToDB(unique)

  console.log('\nDone!')
}

async function extractEventsFromPage(page: Page): Promise<ScrapedEvent[]> {
  return page.evaluate(() => {
    const results: ScrapedEvent[] = []
    const seen = new Set<string>()
    const cards = document.querySelectorAll('a[href*="/events/"]')

    for (const card of cards) {
      const href = card.getAttribute('href') || ''
      const externalId = href.split('/').pop() || ''
      if (!externalId || seen.has(externalId)) continue
      seen.add(externalId)

      const text = card.textContent || ''

      // Get title from img alt (cleanest source)
      const img = card.querySelector('img[alt]')
      let title = img?.getAttribute('alt')?.trim() || ''

      // Get image URL
      const imageUrl = img?.getAttribute('src') || null

      // Parse date: "Mar 12, 2026"
      const dateMatch = text.match(/Mar\s+(\d+),\s+2026/i)

      // Parse time: after "2026" there's "9:00am – 12:00pm" (no space before hour)
      // Match pattern: 2026 then time range
      const timeMatch = text.match(/2026(\d{1,2}:\d{2}[ap]m)\s*[–-]\s*(\d{1,2}:\d{2}[ap]m)/i)

      // Extract venue: between end time "pm" or "am" and "Sign in"
      let venue = ''
      const venueMatch = text.match(/\d{1,2}:\d{2}[ap]m([A-Z].+?)Sign in/i)
      if (venueMatch) {
        venue = venueMatch[1].trim()
      }

      // Extract event type and track from end of text
      let eventType = 'Session'
      let track: string | null = null
      let presentedBy: string | null = null

      const typeMatch = text.match(/(Session|Screening|Showcase|Special Event|Registration|Exhibition|Networking|Party|Lounge|Comedy Event|Activation|General|Reservations)\s*$/i)
      if (typeMatch) eventType = typeMatch[1]

      // Track badges: P=Platinum I=Innovation F=Film M=Music C=Comedy
      const badgeMatch = text.match(/([PIFMC]{1,5})(Session|Screening|Showcase|Special Event|Registration|Exhibition|Networking|Party|Lounge|Comedy Event|Activation|General|Reservations)/i)
      if (badgeMatch) {
        const badges = badgeMatch[1]
        eventType = badgeMatch[2]
        if (badges.includes('I') && !badges.match(/^[^IFMC]*$/)) track = 'Innovation'
        if (badges.includes('F')) track = track || 'Film & TV'
        if (badges.includes('M')) track = track || 'Music'
        if (badges.includes('C')) track = track || 'Comedy'
      }

      // Presented by
      const presMatch = text.match(/PRESENTED BY:\s*(.+?)(?=[PIFMC]{1,5}(?:Session|Screening)|$)/i)
      if (presMatch) presentedBy = presMatch[1].trim()

      // Fallback title from text if img alt was empty
      if (!title) {
        const parts = text.split(/Sign in to add to your favorites/i)
        const clean = parts.length > 1 ? parts[parts.length - 1] : ''
        // Remove known suffixes
        title = clean
          .replace(/Mar\s+\d+,\s+2026/gi, '')
          .replace(/\d+:\d+[ap]m\s*[–-]\s*\d+:\d+[ap]m/gi, '')
          .replace(/PRESENTED BY:.+/i, '')
          .replace(/[PIFMC]{1,5}(Session|Screening|Showcase|Special Event|Registration|Exhibition|Networking|Party|Lounge|Comedy Event|Activation|General|Reservations)/gi, '')
          .trim()
        // Remove venue from start
        if (venue && title.startsWith(venue)) {
          title = title.slice(venue.length).trim()
        }
      }

      if (!title || title.length < 2) continue

      results.push({
        externalId,
        title,
        description: null,
        imageUrl,
        venue,
        date: dateMatch ? `2026-03-${dateMatch[1].padStart(2, '0')}` : '',
        startTime: timeMatch?.[1] || '',
        endTime: timeMatch?.[2] || '',
        eventType,
        track,
        presentedBy,
        detailUrl: `https://schedule.sxsw.com${href}`,
      })
    }

    return results
  })
}

async function enrichDescriptions(events: ScrapedEvent[]) {
  let enriched = 0, failed = 0

  for (let i = 0; i < events.length; i += CONCURRENCY) {
    const batch = events.slice(i, i + CONCURRENCY)

    await Promise.all(
      batch.map(async (event) => {
        try {
          const resp = await fetch(event.detailUrl, {
            headers: { 'User-Agent': 'SXSW-App/1.0' },
            signal: AbortSignal.timeout(10000),
          })
          const html = await resp.text()
          const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/)
          if (descMatch) {
            event.description = descMatch[1]
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim()
          }
          enriched++
        } catch { failed++ }
      }),
    )

    if (i + CONCURRENCY < events.length) await new Promise(r => setTimeout(r, 300))

    const progress = Math.min(i + CONCURRENCY, events.length)
    if (progress % 200 === 0 || progress >= events.length) {
      console.log(`  ${progress}/${events.length} (${enriched} ok, ${failed} failed)`)
    }
  }
}

async function writeToDB(scrapedEvents: ScrapedEvent[]) {
  // Venues
  const venueNames = [...new Set(scrapedEvents.map(e => e.venue).filter(Boolean))]
  console.log(`  ${venueNames.length} venues...`)
  const venueMap = new Map<string, string>()
  for (const name of venueNames) {
    const existing = await db.select().from(venues).where(eq(venues.name, name)).limit(1)
    if (existing[0]) { venueMap.set(name, existing[0].id) }
    else {
      const id = randomUUID()
      await db.insert(venues).values({ id, name })
      venueMap.set(name, id)
    }
  }

  // Tracks
  const trackNames = [...new Set(scrapedEvents.map(e => e.track).filter(Boolean))] as string[]
  console.log(`  ${trackNames.length} tracks...`)
  const trackMap = new Map<string, string>()
  for (const name of trackNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await db.select().from(tracks).where(eq(tracks.slug, slug)).limit(1)
    if (existing[0]) { trackMap.set(name, existing[0].id) }
    else {
      const id = randomUUID()
      await db.insert(tracks).values({ id, name, slug })
      trackMap.set(name, id)
    }
  }

  const typeMap: Record<string, string> = {
    session: 'session', screening: 'screening', showcase: 'performance',
    'special event': 'other', registration: 'other', exhibition: 'other',
    networking: 'meetup', party: 'party', lounge: 'other',
    'comedy event': 'performance', activation: 'other', general: 'other', reservations: 'other',
  }

  console.log(`  Writing ${scrapedEvents.length} events...`)
  let created = 0, updated = 0, skipped = 0

  for (const se of scrapedEvents) {
    const startISO = parseTime(se.date, se.startTime)
    const endISO = parseTime(se.date, se.endTime)

    // Skip if we can't parse a valid date + time
    if (!se.title || !startISO || !endISO) {
      skipped++
      continue
    }

    const startDate = new Date(startISO)
    const endDate = new Date(endISO)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { skipped++; continue }
    if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1)

    try {
      const existing = await db.select().from(events).where(eq(events.externalId, se.externalId)).limit(1)

      const data = {
        title: se.title,
        description: se.description,
        imageUrl: se.imageUrl,
        startTime: startDate,
        endTime: endDate,
        day: se.date,
        venueId: se.venue ? venueMap.get(se.venue) ?? null : null,
        trackId: se.track ? trackMap.get(se.track) ?? null : null,
        eventType: typeMap[se.eventType.toLowerCase()] ?? 'session',
        externalId: se.externalId,
        rsvpUrl: se.detailUrl,
        lastScrapedAt: new Date(),
        updatedAt: new Date(),
      }

      if (existing[0]) {
        await db.update(events).set(data).where(eq(events.externalId, se.externalId))
        updated++
      } else {
        await db.insert(events).values({ id: randomUUID(), ...data })
        created++
      }
    } catch (err) {
      console.error(`  ERR ${se.externalId}: ${err}`)
      skipped++
    }

    if ((created + updated) % 500 === 0 && (created + updated) > 0) {
      console.log(`  ... ${created + updated} written`)
    }
  }

  console.log(`  Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`)
}

function parseTime(date: string, time: string): string | null {
  if (!date || !time) return null
  const match = time.match(/(\d+):(\d+)(am|pm)/i)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const ampm = match[3].toLowerCase()
  if (ampm === 'pm' && hours !== 12) hours += 12
  if (ampm === 'am' && hours === 12) hours = 0
  return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`
}

main().catch(err => { console.error('Scrape failed:', err); process.exit(1) })
