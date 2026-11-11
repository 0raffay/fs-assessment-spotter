import { callEndpoint } from '@/lib/api'
import type { TripPlan } from '@/types'

import { FORECAST_HOURS, type Heatmap } from '../types'

import { heatmapEndpoint } from './forecast.endpoints'

export class ForecastService {
  /** The heatmap for a plan's corridor, with the plan's load (load rules change wind risk). */
  static getHeatmap(plan: TripPlan, signal?: AbortSignal): Promise<Heatmap> {
    const [west, south, east, north] = plan.bbox
    return callEndpoint(heatmapEndpoint, {
      query: {
        west,
        south,
        east,
        north,
        hours: FORECAST_HOURS,
        loadWeightLb: plan.request.loadWeightLb,
      },
      signal,
    })
  }
}
