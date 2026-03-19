import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment for tests
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/sxsw_test')
vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-32-characters-long-xxx')
vi.stubEnv('RESEND_API_KEY', 're_test_xxxxxxxxxxxx')
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('PORT', '3001')
vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3001')
vi.stubEnv('EMAIL_FROM', 'test@sxsw.pizza')
vi.stubEnv('API_BASE_URL', 'http://localhost:3001')

beforeAll(() => {
  // Global test setup
})

afterAll(() => {
  // Global test teardown
})
