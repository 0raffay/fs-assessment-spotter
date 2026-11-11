import type { HttpHandler } from 'msw'

import { forecastHandlers } from '@/features/forecast/api/forecast.mock'
import { routesHandlers } from '@/features/routes/api/routes.mock'
import { tripPlannerHandlers } from '@/features/trip-planner/api/trip-planner.mock'

/**
 * Every mocked endpoint. Each feature exports its own handlers from `api/<feature>.mock.ts`;
 * add them here. Turning mocks off (VITE_ENABLE_MOCKS=false) makes the app use the real API.
 */
export const handlers: HttpHandler[] = [
  ...tripPlannerHandlers,
  ...routesHandlers,
  ...forecastHandlers,
]
