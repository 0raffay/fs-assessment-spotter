import { createBrowserRouter } from 'react-router'

import { TripPlannerPage } from '@/features/trip-planner/page'
import { ROUTES } from '@/lib/routes'

/** Maps each ROUTES entry (called with no args = path pattern) to a feature page. */
export const router = createBrowserRouter([
  { path: ROUTES.routePlanner(), element: <TripPlannerPage /> },
])
