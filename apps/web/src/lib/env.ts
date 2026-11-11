import { z } from 'zod'

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true')

/** A blank value (e.g. an empty variable in a hosting dashboard) counts as "not set". */
const blankAsUnset = (value: unknown) => (value === '' ? undefined : value)

const envSchema = z.object({
  /** Base URL of the Django API. Dev default `/api` goes through the Vite proxy. */
  VITE_API_BASE_URL: z.preprocess(blankAsUnset, z.string().min(1).default('/api')),
  /**
   * Serve API responses from MSW instead of the network. Defaults to on in development and OFF in
   * production builds, so a deploy can never ship fake data by accident.
   */
  VITE_ENABLE_MOCKS: z.preprocess(blankAsUnset, booleanString.default(import.meta.env.DEV)),
  /** Artificial latency for mocked responses, in ms, so loading states are visible. */
  VITE_MOCK_DELAY_MS: z.coerce.number().int().nonnegative().default(700),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(import.meta.env)
