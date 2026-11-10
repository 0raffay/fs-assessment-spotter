import { useQuery } from '@tanstack/react-query'

import { healthKeys } from './health.keys'
import { HealthService } from './health.service'

/** React Query hooks for the health feature. Components import from here only. */
export const useHealthStatus = () =>
  useQuery({
    queryKey: healthKeys.status(),
    queryFn: HealthService.getStatus,
  })
