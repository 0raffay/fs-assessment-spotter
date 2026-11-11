import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, devices } from '@playwright/test'

const PORT = 5190
const API_PORT = 8020
/** apps/api, absolute (Windows' shell can't run a `../` executable path). */
const apiDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '../api')
/** The API's virtualenv Python (override with API_PYTHON). */
const apiPython =
  process.env.API_PYTHON ??
  resolve(apiDir, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python')
/** Optional installed browser to use instead of Playwright's bundled one (e.g. `msedge`, `chrome`). */
const channel = process.env.PW_CHANNEL || undefined

/**
 * End-to-end tests of the real app, against either backend:
 * - `mocks` (default, `pnpm test:e2e`): the in-browser MSW mocks.
 * - `django` (`pnpm test:e2e:django`, see playwright.django.config.ts): the real Django API with
 *   its offline fake providers, so no keys, network or rate limits.
 */
export function createConfig(backend: 'mocks' | 'django') {
  const withDjango = backend === 'django'
  return defineConfig({
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
    webServer: [
      ...(withDjango
        ? [
            {
              command: `"${apiPython}" "${resolve(apiDir, 'manage.py')}" runserver 127.0.0.1:${API_PORT} --noreload`,
              url: `http://127.0.0.1:${API_PORT}/api/health/`,
              reuseExistingServer: false,
              timeout: 120_000,
              env: { SKYRIG_PROVIDERS: 'fake' },
            },
          ]
        : []),
      {
        command: `pnpm exec vite --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        // A server left from the other mode would have the wrong mocks setting.
        reuseExistingServer: !process.env.CI && !withDjango,
        timeout: 120_000,
        env: withDjango
          ? { VITE_ENABLE_MOCKS: 'false', VITE_API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` }
          : { VITE_ENABLE_MOCKS: 'true', VITE_MOCK_DELAY_MS: '150' },
      },
    ],
  })
}

export default createConfig('mocks')
