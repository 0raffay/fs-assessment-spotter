import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/lib/api'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Retry network hiccups, never client mistakes or bad responses.
        retry: (count, error) =>
          count < 2 && isApiError(error) && (error.kind === 'network' || error.kind === 'timeout'),
      },
    },
  })
}
