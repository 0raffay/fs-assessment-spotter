import { skipToken, useQuery } from '@tanstack/react-query'

import type { TripRequest } from '@/types'

import { routesKeys } from './routes.keys'
import { RoutesService } from './routes.service'

/**
 * The plan for a trip. Planning is a pure function of the request, so it's a cached query (not a
 * mutation): going back to an earlier trip, or reloading a shared link, reuses the result.
 */
export function useTripPlan(request: TripRequest | null) {
  return useQuery({
    queryKey: request ? routesKeys.plan(request) : routesKeys.all,
    queryFn: request ? ({ signal }) => RoutesService.planTrip(request, signal) : skipToken,
    staleTime: 10 * 60_000,
  })
}
