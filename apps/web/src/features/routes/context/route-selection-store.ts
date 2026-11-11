import { createStrictContext } from '@/lib/create-strict-context'

import type { RouteSelectionState } from '../types'

export const [RouteSelectionContextProvider, useRouteSelection, useOptionalRouteSelection] =
  createStrictContext<RouteSelectionState>('RouteSelection')
