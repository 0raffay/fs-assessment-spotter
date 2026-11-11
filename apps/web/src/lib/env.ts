import { z } from 'zod'

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true')

const envSchema = z.object({
  /** Base URL of the Django API. Dev default `/api` goes through the Vite proxy. */
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  /** Serve API responses from MSW instead of the network. Turn off once the backend is running. */
  VITE_ENABLE_MOCKS: booleanString.default(true),
  /** Artificial latency for mocked responses, in ms, so loading states are visible. */
  VITE_MOCK_DELAY_MS: z.coerce.number().int().nonnegative().default(700),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(import.meta.env)
