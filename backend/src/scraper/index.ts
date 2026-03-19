import { db } from '@/db/client'
import { scrapeRuns } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createChildLogger } from '@/lib/logger'
import { fetchAllSchedulePages } from './fetcher'
import { parseScheduleData } from './parser'
import { normalizeEvents } from './normalizer'
import { computeChangeset, applyChangeset } from './differ'

const log = createChildLogger('scraper')

export async function runScrapePipeline(): Promise<void> {
  const startTime = Date.now()

  // Create audit log entry
  const [run] = await db
    .insert(scrapeRuns)
    .values({ status: 'running' })
    .returning()

  if (!run) {
    log.error('Failed to create scrape run record')
    return
  }

  const errors: Array<{ message: string; context?: string }> = []

  try {
    log.info({ runId: run.id }, 'Starting scrape pipeline')

    // Stage 1: Fetch
    const pages = await fetchAllSchedulePages()
    log.info({ pageCount: pages.length }, 'Fetch stage complete')

    if (pages.length === 0) {
      throw new Error('No schedule pages fetched')
    }

    // Stage 2: Parse
    const rawEvents = pages.flatMap((page) => {
      try {
        return parseScheduleData(page)
      } catch (err) {
        errors.push({ message: String(err), context: 'parse' })
        return []
      }
    })
    log.info({ rawEventCount: rawEvents.length }, 'Parse stage complete')

    // Stage 3: Normalize & deduplicate
    const normalized = normalizeEvents(rawEvents)
    log.info({ normalizedCount: normalized.length }, 'Normalize stage complete')

    // Stage 4: Diff & apply
    const changeset = await computeChangeset(normalized)
    const result = await applyChangeset(changeset)
    log.info(result, 'Apply stage complete')

    // Update run record
    await db
      .update(scrapeRuns)
      .set({
        status: 'completed',
        eventsFound: normalized.length,
        eventsCreated: result.eventsCreated,
        eventsUpdated: result.eventsUpdated,
        venuesCreated: result.venuesCreated,
        errors: errors.length > 0 ? errors : null,
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      })
      .where(eq(scrapeRuns.id, run.id))

    log.info(
      { runId: run.id, duration: Date.now() - startTime, ...result },
      'Scrape pipeline completed',
    )
  } catch (err) {
    log.error({ err, runId: run.id }, 'Scrape pipeline failed')

    errors.push({ message: String(err), context: 'pipeline' })

    await db
      .update(scrapeRuns)
      .set({
        status: 'failed',
        errors,
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      })
      .where(eq(scrapeRuns.id, run.id))
  }
}
