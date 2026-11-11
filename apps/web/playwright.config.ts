import { defineConfig, devices } from '@playwright/test'

const PORT = 5190
/** Optional installed browser to use instead of Playwright's bundled one (e.g. `msedge`, `chrome`). */
const channel = process.env.PW_CHANNEL || undefined

/**
 * End-to-end tests against the real app with MSW mocks in the browser (the same mocks `pnpm dev`
 * uses). Pointing `VITE_ENABLE_MOCKS=false` at a running backend runs the same suite against it.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Each page renders WebGL in software; more workers than this starve each other.
  workers: 2,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // A fixed zone keeps departure defaults and clock labels the same on every machine.
    timezoneId: 'America/Chicago',
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, channel },
    },
    { name: 'phone', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_ENABLE_MOCKS: 'true', VITE_MOCK_DELAY_MS: '150' },
  },
})
