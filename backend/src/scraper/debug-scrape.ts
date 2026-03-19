/**
 * Debug: scrape one page and dump the raw extracted data
 */
import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('https://schedule.sxsw.com/2026/search/event', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })

  try { await page.click('button:has-text("Accept")', { timeout: 3000 }) } catch {}
  await page.waitForSelector('a[href*="/events/"]', { timeout: 15000 })
  await page.waitForTimeout(3000)

  // Dump raw card data for first 5 events
  const data = await page.evaluate(() => {
    const cards = document.querySelectorAll('a[href*="/events/"]')
    const results: Array<{ href: string; rawText: string; innerHTML: string }> = []
    const seen = new Set<string>()

    for (const card of Array.from(cards).slice(0, 5)) {
      const href = card.getAttribute('href') || ''
      if (seen.has(href)) continue
      seen.add(href)

      results.push({
        href,
        rawText: card.textContent || '',
        innerHTML: card.innerHTML.substring(0, 1000),
      })
    }
    return results
  })

  for (const d of data) {
    console.log('\n--- EVENT ---')
    console.log('href:', d.href)
    console.log('rawText:', d.rawText.substring(0, 300))
    console.log('innerHTML:', d.innerHTML.substring(0, 500))
  }

  await browser.close()
}

main().catch(console.error)
