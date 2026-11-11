import { defineEndpoint } from '@/lib/api'

import { heatmapQuerySchema, heatmapSchema } from '../types'

/** `GET /api/weather/heatmap/` — hourly risk grid over the trip corridor (docs/api-contract.md). */
export const heatmapEndpoint = defineEndpoint({
  method: 'GET',
  path: '/weather/heatmap/',
  query: heatmapQuerySchema,
  response: heatmapSchema,
})
