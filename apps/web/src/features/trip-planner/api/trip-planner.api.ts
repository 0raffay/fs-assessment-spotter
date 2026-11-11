import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useDebouncedValue } from '@/hooks/use-debounced-value'

import { tripPlannerKeys } from './trip-planner.keys'
import { TripPlannerService } from './trip-planner.service'

const MIN_QUERY_LENGTH = 2

/** Debounced location search. Idle until the query has at least two characters. */
export function usePlaceSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 250)
  const enabled = debounced.length >= MIN_QUERY_LENGTH

  const result = useQuery({
    queryKey: tripPlannerKeys.places(debounced),
    queryFn: ({ signal }) => TripPlannerService.searchPlaces(debounced, signal),
    enabled,
    staleTime: 60 * 60_000,
    placeholderData: keepPreviousData,
  })

  return { ...result, isIdle: !enabled, isTyping: query.trim() !== debounced }
}
