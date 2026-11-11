import { z } from 'zod'

import { defineEndpoint } from '@/lib/api'
import { placeSchema } from '@/types'

/** `GET /api/geocode/?q=` — location search (docs/api-contract.md). */
export const geocodeEndpoint = defineEndpoint({
  method: 'GET',
  path: '/geocode/',
  query: z.object({ q: z.string().trim().min(2).max(100) }),
  response: z.object({ results: z.array(placeSchema).max(10) }),
})
