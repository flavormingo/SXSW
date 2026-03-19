import type { Hono } from 'hono'
import { authRoutes } from './auth.routes'
import { eventRoutes } from './events.routes'
import { scheduleRoutes } from './schedule.routes'
import { favoritesRoutes } from './favorites.routes'
import { recommendationsRoutes } from './recommendations.routes'
import { venueRoutes } from './venues.routes'
import { trackRoutes } from './tracks.routes'
import { notificationRoutes } from './notifications.routes'
import { analyticsRoutes } from './analytics.routes'
import { userRoutes } from './user.routes'
import { adminRoutes } from './admin.routes'

export function mountRoutes(app: Hono) {
  app.route('/api', authRoutes)
  app.route('/api/events', eventRoutes)
  app.route('/api/schedule', scheduleRoutes)
  app.route('/api/favorites', favoritesRoutes)
  app.route('/api/recommendations', recommendationsRoutes)
  app.route('/api/venues', venueRoutes)
  app.route('/api/tracks', trackRoutes)
  app.route('/api/notifications', notificationRoutes)
  app.route('/api/analytics', analyticsRoutes)
  app.route('/api/user', userRoutes)
  app.route('/api/admin', adminRoutes)
}
