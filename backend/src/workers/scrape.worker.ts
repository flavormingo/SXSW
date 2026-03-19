import { runScrapePipeline } from '@/scraper'

// Standalone entry point for manual scrape runs
// Usage: npx tsx src/workers/scrape.worker.ts
runScrapePipeline()
  .then(() => {
    console.log('Scrape completed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Scrape failed:', err)
    process.exit(1)
  })
