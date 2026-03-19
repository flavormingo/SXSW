import { env } from '@/env'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('scraper:fetcher')

const DEFAULT_HEADERS = {
  'User-Agent': 'SXSW-App/1.0 (schedule-sync; contact@sxsw.pizza)',
  Accept: 'text/html,application/json',
}

interface FetchOptions {
  maxRetries?: number
  retryDelayMs?: number
  rateLimitMs?: number
}

const defaults: FetchOptions = {
  maxRetries: 3,
  retryDelayMs: 2000,
  rateLimitMs: env.SCRAPE_RATE_LIMIT_MS,
}

let lastRequestTime = 0

async function rateLimitDelay(ms: number) {
  const elapsed = Date.now() - lastRequestTime
  if (elapsed < ms) {
    await new Promise((resolve) => setTimeout(resolve, ms - elapsed))
  }
  lastRequestTime = Date.now()
}

export async function fetchPage(url: string, opts: FetchOptions = {}): Promise<string> {
  const { maxRetries, retryDelayMs, rateLimitMs } = { ...defaults, ...opts }

  await rateLimitDelay(rateLimitMs!)

  for (let attempt = 1; attempt <= maxRetries!; attempt++) {
    try {
      log.debug({ url, attempt }, 'Fetching page')

      const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(30_000),
      })

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') ?? '10', 10)
          log.warn({ url, retryAfter }, 'Rate limited, backing off')
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
          continue
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (err) {
      log.warn({ url, attempt, err }, 'Fetch attempt failed')

      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${err}`)
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelayMs! * attempt))
    }
  }

  throw new Error(`Unreachable: fetch exhausted retries for ${url}`)
}

export async function fetchJSON<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const html = await fetchPage(url, opts)
  return JSON.parse(html) as T
}

/**
 * Fetch all paginated schedule pages.
 * SXSW typically serves schedule by day or as a single large JSON API.
 */
export async function fetchAllSchedulePages(): Promise<string[]> {
  const baseUrl = env.SXSW_SCHEDULE_BASE_URL
  const pages: string[] = []

  // Strategy 1: Try the JSON API endpoint first (SXSW 2024+ pattern)
  try {
    const apiUrl = `${baseUrl}/2026/schedule.json`
    const json = await fetchPage(apiUrl)
    pages.push(json)
    log.info({ url: apiUrl }, 'Fetched schedule JSON API')
    return pages
  } catch {
    log.info('JSON API not available, falling back to HTML scraping')
  }

  // Strategy 2: Scrape day-by-day HTML pages
  const days = [
    '2026-03-13', '2026-03-14', '2026-03-15', '2026-03-16',
    '2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20',
    '2026-03-21', '2026-03-22',
  ]

  for (const day of days) {
    try {
      const url = `${baseUrl}/2026/events?day=${day}`
      const html = await fetchPage(url)
      pages.push(html)
      log.info({ day }, 'Fetched schedule page')
    } catch (err) {
      log.warn({ day, err }, 'Failed to fetch day page, continuing')
    }
  }

  return pages
}
