import { callEndpoint } from '@/lib/api'
import type { Place } from '@/types'

import { geocodeEndpoint } from './trip-planner.endpoints'

export class TripPlannerService {
  static async searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
    const { results } = await callEndpoint(geocodeEndpoint, { query: { q: query }, signal })
    return results
  }
}
