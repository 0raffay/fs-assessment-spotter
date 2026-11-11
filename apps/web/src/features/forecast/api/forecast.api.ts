import { skipToken, useQuery } from '@tanstack/react-query'

import type { TripPlan } from '@/types'

import { forecastKeys } from './forecast.keys'
import { ForecastService } from './forecast.service'

/** Heatmap for the plan's corridor. Fetched once; the slider only restyles it. */
export function useHeatmap(plan: TripPlan | null | undefined) {
  return useQuery({
    queryKey: plan ? forecastKeys.heatmap(plan) : forecastKeys.all,
    queryFn: plan ? ({ signal }) => ForecastService.getHeatmap(plan, signal) : skipToken,
    staleTime: 30 * 60_000,
  })
}
