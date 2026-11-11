import { buildHeatmap } from '@/mocks/engine/heatmap'
import { mockEndpoint } from '@/mocks/mock-endpoint'

import { heatmapEndpoint } from './forecast.endpoints'

export const forecastHandlers = [
  mockEndpoint(
    heatmapEndpoint,
    ({ query }) =>
      buildHeatmap({
        bbox: [query.west, query.south, query.east, query.north],
        hours: query.hours,
        loadWeightLb: query.loadWeightLb,
      }),
    { delayMs: 600 },
  ),
]
