import { searchPlaces } from '@/mocks/engine/places'
import { mockEndpoint } from '@/mocks/mock-endpoint'

import { geocodeEndpoint } from './trip-planner.endpoints'

export const tripPlannerHandlers = [
  mockEndpoint(geocodeEndpoint, ({ query }) => ({ results: searchPlaces(query.q) }), {
    delayMs: 180,
  }),
]
