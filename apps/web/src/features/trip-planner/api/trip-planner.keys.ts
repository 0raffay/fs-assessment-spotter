import { createQueryKeys } from '@/lib/api'

const keys = createQueryKeys('trip-planner')

export const tripPlannerKeys = {
  all: keys.all,
  places: (query: string) => keys.of('places', query.trim().toLowerCase()),
}
