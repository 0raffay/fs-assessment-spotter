import { createQueryKeys } from '@/lib/api'
import type { TripPlan } from '@/types'

const keys = createQueryKeys('forecast')

export const forecastKeys = {
  all: keys.all,
  heatmap: (plan: TripPlan) =>
    keys.of('heatmap', ...plan.bbox, plan.request.loadWeightLb, plan.forecastIssuedAt),
}
