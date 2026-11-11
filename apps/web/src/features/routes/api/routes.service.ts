import { callEndpoint } from '@/lib/api'
import type { TripPlan, TripRequest } from '@/types'

import { planTripEndpoint } from './routes.endpoints'

export class RoutesService {
  static planTrip(request: TripRequest, signal?: AbortSignal): Promise<TripPlan> {
    return callEndpoint(planTripEndpoint, { body: request, signal })
  }
}
