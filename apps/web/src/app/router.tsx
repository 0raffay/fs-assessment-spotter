import { createBrowserRouter } from 'react-router'

import { RoutePlannerPage } from '@/features/route-planner/page'
import { ROUTES } from '@/lib/routes'

/** Maps each ROUTES entry (called with no args = path pattern) to a feature page. */
export const router = createBrowserRouter([
  { path: ROUTES.routePlanner(), element: <RoutePlannerPage /> },
])
