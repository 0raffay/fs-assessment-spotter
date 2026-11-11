import { createQueryKeys } from '@/lib/api'
import type { TripRequest } from '@/types'

const keys = createQueryKeys('routes')

export const routesKeys = {
  all: keys.all,
  /** One cache entry per distinct trip request. */
  plan: (request: TripRequest) =>
    keys.of(
      'plan',
      request.origin.id,
      request.destination.id,
      request.departureAt,
      request.loadWeightLb,
      request.intervalMiles,
    ),
}
