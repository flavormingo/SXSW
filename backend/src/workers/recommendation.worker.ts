import { db } from '@/db/client'
import { users } from '@/db/schema'
import { computeRecommendationsForUser } from '@/services/recommendation.service'
import { createChildLogger } from '@/lib/logger'

const log = createChildLogger('worker:recommendations')

export async function runRecommendationBatch() {
  const allUsers = await db.select({ id: users.id }).from(users)

  log.info({ userCount: allUsers.length }, 'Starting recommendation batch')

  let processed = 0
  let failed = 0

  for (const user of allUsers) {
    try {
      await computeRecommendationsForUser(user.id)
      processed++
    } catch (err) {
      log.error({ err, userId: user.id }, 'Failed to compute recommendations for user')
      failed++
    }

    // Avoid hammering the DB
    if (processed % 50 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  log.info({ processed, failed, total: allUsers.length }, 'Recommendation batch complete')
}
