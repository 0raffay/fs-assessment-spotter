import { setupServer } from 'msw/node'

import { handlers } from './handlers'

/** The same handlers as the browser, for Vitest. Override per test with `server.use(...)`. */
export const server = setupServer(...handlers)
