import { createConfig } from './playwright.config.ts'

/** The e2e suite against the real Django API (fake providers). Run: `pnpm test:e2e:django`. */
export default createConfig('django')
