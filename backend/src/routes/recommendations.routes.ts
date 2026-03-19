import { Hono } from 'hono'
import { requireAuth } from '@/auth/middleware'
import * as recService from '@/services/recommendation.service'

const recommendationsRoutes = new Hono()

recommendationsRoutes.use('/*', requireAuth)

recommendationsRoutes.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const recs = await recService.getUserRecommendations(c.get('user').id, limit)

  return c.json({
    data: recs.map((r) => ({
      ...r.event,
      score: r.score,
      reason: r.reason,
      venue: r.venueName ? { name: r.venueName } : null,
      track: r.trackName ? { name: r.trackName, color: r.trackColor } : null,
    })),
  })
})

recommendationsRoutes.post('/:eventId/dismiss', async (c) => {
  await recService.dismissRecommendation(c.get('user').id, c.req.param('eventId'))
  return c.json({ success: true })
})

export { recommendationsRoutes }
