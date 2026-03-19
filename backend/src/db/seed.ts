import { db } from './client'
import { tracks, venues, events } from './schema'
import { randomUUID } from 'crypto'

const TRACKS = [
  { name: 'Music', slug: 'music', color: '#E91E63', icon: 'music.note', sortOrder: 1 },
  { name: 'Film & TV', slug: 'film-tv', color: '#9C27B0', icon: 'film', sortOrder: 2 },
  { name: 'Interactive', slug: 'interactive', color: '#2196F3', icon: 'desktopcomputer', sortOrder: 3 },
  { name: 'Comedy', slug: 'comedy', color: '#FF9800', icon: 'face.smiling', sortOrder: 4 },
  { name: 'Health & Wellness', slug: 'health-wellness', color: '#4CAF50', icon: 'heart', sortOrder: 5 },
  { name: 'Food & Culture', slug: 'food-culture', color: '#795548', icon: 'fork.knife', sortOrder: 6 },
  { name: 'AI & Emerging Tech', slug: 'ai-emerging-tech', color: '#00BCD4', icon: 'cpu', sortOrder: 7 },
  { name: 'Climate & Sustainability', slug: 'climate-sustainability', color: '#8BC34A', icon: 'leaf', sortOrder: 8 },
  { name: 'Gaming', slug: 'gaming', color: '#FF5722', icon: 'gamecontroller', sortOrder: 9 },
  { name: 'Keynotes', slug: 'keynotes', color: '#000000', icon: 'star', sortOrder: 0 },
]

const VENUES = [
  { name: 'Austin Convention Center', address: '500 E Cesar Chavez St, Austin, TX', latitude: 30.2637, longitude: -97.7396, capacity: 5000 },
  { name: 'Paramount Theatre', address: '713 Congress Ave, Austin, TX', latitude: 30.2692, longitude: -97.7431, capacity: 1300 },
  { name: 'Palmer Events Center', address: '900 Barton Springs Rd, Austin, TX', latitude: 30.2602, longitude: -97.7510, capacity: 3000 },
  { name: 'Moody Theater', address: '310 W Willie Nelson Blvd, Austin, TX', latitude: 30.2655, longitude: -97.7511, capacity: 2750 },
  { name: 'Fairmont Austin', address: '101 Red River St, Austin, TX', latitude: 30.2621, longitude: -97.7388, capacity: 800 },
  { name: 'JW Marriott Austin', address: '110 E 2nd St, Austin, TX', latitude: 30.2651, longitude: -97.7430, capacity: 600 },
  { name: 'Hilton Austin', address: '500 E 4th St, Austin, TX', latitude: 30.2660, longitude: -97.7389, capacity: 500 },
  { name: 'Stubb\'s BBQ', address: '801 Red River St, Austin, TX', latitude: 30.2691, longitude: -97.7354, capacity: 2100 },
]

const DAYS = ['2027-03-12', '2027-03-13', '2027-03-14', '2027-03-15', '2027-03-16', '2027-03-17', '2027-03-18', '2027-03-19', '2027-03-20', '2027-03-21']

const EVENT_TEMPLATES = [
  { title: 'The Future of AI in Creative Industries', type: 'panel', track: 'ai-emerging-tech' },
  { title: 'Opening Night Film Premiere', type: 'screening', track: 'film-tv' },
  { title: 'Indie Showcase: Rising Stars', type: 'performance', track: 'music' },
  { title: 'Building Climate Tech That Scales', type: 'session', track: 'climate-sustainability' },
  { title: 'VR Storytelling Workshop', type: 'workshop', track: 'interactive' },
  { title: 'Stand-Up Comedy Showcase', type: 'performance', track: 'comedy' },
  { title: 'Keynote: Technology Meets Humanity', type: 'session', track: 'keynotes' },
  { title: 'Austin Food Truck Tour', type: 'meetup', track: 'food-culture' },
  { title: 'Gaming Industry Roundtable', type: 'panel', track: 'gaming' },
  { title: 'Mental Health in Tech', type: 'session', track: 'health-wellness' },
  { title: 'Documentary Screening & Q&A', type: 'screening', track: 'film-tv' },
  { title: 'Electronic Music Showcase', type: 'performance', track: 'music' },
  { title: 'Startup Pitch Competition', type: 'session', track: 'interactive' },
  { title: 'Hip-Hop Evolution Panel', type: 'panel', track: 'music' },
  { title: 'Web3 and Decentralized Media', type: 'session', track: 'ai-emerging-tech' },
]

async function seed() {
  console.log('Seeding database...')

  // Seed tracks
  for (const track of TRACKS) {
    await db.insert(tracks).values({ id: randomUUID(), ...track }).onConflictDoNothing()
  }
  console.log(`Seeded ${TRACKS.length} tracks`)

  // Seed venues
  const venueIds: string[] = []
  for (const venue of VENUES) {
    const id = randomUUID()
    await db.insert(venues).values({ id, ...venue }).onConflictDoNothing()
    venueIds.push(id)
  }
  console.log(`Seeded ${VENUES.length} venues`)

  // Seed events
  const trackRows = await db.select().from(tracks)
  const trackBySlug = new Map(trackRows.map((t) => [t.slug, t.id]))

  let eventCount = 0
  for (const day of DAYS) {
    const hoursOfDay = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

    for (const hour of hoursOfDay) {
      // 1-3 events per hour slot
      const eventsThisHour = EVENT_TEMPLATES.slice(0, Math.floor(Math.random() * 3) + 1)

      for (const template of eventsThisHour) {
        const startTime = new Date(`${day}T${String(hour).padStart(2, '0')}:00:00-05:00`)
        const durationMinutes = [60, 90, 120][Math.floor(Math.random() * 3)]!
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

        await db.insert(events).values({
          id: randomUUID(),
          title: `${template.title} — Day ${DAYS.indexOf(day) + 1}`,
          description: `Join us for ${template.title.toLowerCase()} during SXSW. This ${template.type} explores cutting-edge ideas and brings together industry leaders.`,
          startTime,
          endTime,
          day,
          venueId: venueIds[Math.floor(Math.random() * venueIds.length)],
          trackId: trackBySlug.get(template.track),
          eventType: template.type as 'session' | 'panel' | 'workshop' | 'screening' | 'performance' | 'meetup',
          isFeatured: Math.random() < 0.15,
          externalId: `seed-${day}-${hour}-${template.track}`,
        })
        eventCount++
      }
    }
  }

  console.log(`Seeded ${eventCount} events`)
  console.log('Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
