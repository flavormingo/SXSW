import { CronJob } from 'cron'
import { env } from '@/env'
import { logger } from '@/lib/logger'
import { runScrapePipeline } from '@/scraper'
import { processScheduleReminders } from './notification.worker'
import { runRecommendationBatch } from './recommendation.worker'

const log = logger.child({ module: 'scheduler' })

const jobs: CronJob[] = []

function registerJob(name: string, cronExpression: string, handler: () => Promise<void>) {
  const job = CronJob.from({
    cronTime: cronExpression,
    onTick: async () => {
      log.info({ job: name }, 'Job starting')
      const start = Date.now()
      try {
        await handler()
        log.info({ job: name, duration: Date.now() - start }, 'Job completed')
      } catch (err) {
        log.error({ job: name, err, duration: Date.now() - start }, 'Job failed')
      }
    },
    start: false,
    timeZone: 'America/Chicago', // SXSW is in Austin, TX
  })

  jobs.push(job)
  log.info({ job: name, cron: cronExpression }, 'Job registered')
}

// Scraper: runs every 6 hours by default
registerJob('scraper', env.SCRAPE_CRON, runScrapePipeline)

// Notification reminders: check every minute
registerJob('reminders', '* * * * *', processScheduleReminders)

// Recommendations: nightly at 3 AM CT
registerJob('recommendations', '0 3 * * *', runRecommendationBatch)

// Start all jobs
log.info({ jobCount: jobs.length }, 'Starting scheduler')
jobs.forEach((job) => job.start())

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('Shutting down scheduler')
  jobs.forEach((job) => job.stop())
  process.exit(0)
})

process.on('SIGINT', () => {
  log.info('Shutting down scheduler')
  jobs.forEach((job) => job.stop())
  process.exit(0)
})
