import { createConfig } from './playwright.config.ts'

/** The e2e suite against the production bundle (with mocks). Run: `pnpm test:e2e:build`. */
export default createConfig('build')
