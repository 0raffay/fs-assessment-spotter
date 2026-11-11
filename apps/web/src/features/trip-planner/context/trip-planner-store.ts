import { createStrictContext } from '@/lib/create-strict-context'

import type { TripPlannerState } from '../types'

export const [Provider, useTripPlanner] = createStrictContext<TripPlannerState>('TripPlanner')

/** URL search param holding the planned trip, so links can be shared and reloads keep the trip. */
export const TRIP_PARAM = 'trip'
