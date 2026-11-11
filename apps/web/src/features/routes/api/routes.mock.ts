import { buildTripPlan } from '@/mocks/engine/trip'
import { mockEndpoint, MockHttpError } from '@/mocks/mock-endpoint'

import { planTripEndpoint } from './routes.endpoints'

export const routesHandlers = [
  mockEndpoint(
    planTripEndpoint,
    ({ body }) => {
      if (body.origin.id === body.destination.id) {
        throw new MockHttpError(400, {
          detail: 'Origin and destination must be different places.',
          code: 'same_place',
          fieldErrors: { destination: ['Destination must differ from the origin'] },
        })
      }
      return buildTripPlan(body)
    },
    { delayMs: 1100 },
  ),
]
