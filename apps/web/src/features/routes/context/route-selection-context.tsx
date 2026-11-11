import { useMemo, useState, type ReactNode } from 'react'

import type { CheckpointId, RouteId, TripPlan } from '@/types'

import type { RouteSelectionState } from '../types'

import { RouteSelectionContextProvider } from './route-selection-store'

interface Selection {
  planId: TripPlan['id']
  routeId: RouteId
  checkpointId: CheckpointId | null
}

/** Selection resets to the recommended route whenever a new plan arrives. */
export function RouteSelectionProvider({
  plan,
  children,
}: {
  plan: TripPlan
  children: ReactNode
}) {
  const [selection, setSelection] = useState<Selection>({
    planId: plan.id,
    routeId: plan.recommendedRouteId,
    checkpointId: null,
  })
  const current: Selection =
    selection.planId === plan.id
      ? selection
      : { planId: plan.id, routeId: plan.recommendedRouteId, checkpointId: null }

  const value = useMemo<RouteSelectionState>(() => {
    const selectedRoute =
      plan.routes.find((route) => route.id === current.routeId) ?? plan.routes[0]!
    const selectedCheckpoint =
      selectedRoute.checkpoints.find((c) => c.id === current.checkpointId) ?? null

    return {
      plan,
      selectedRoute,
      selectedCheckpoint,
      selectRoute: (routeId) => setSelection({ planId: plan.id, routeId, checkpointId: null }),
      selectCheckpoint: (checkpointId, routeId = selectedRoute.id) =>
        setSelection({ planId: plan.id, routeId, checkpointId }),
      stepCheckpoint: (direction) => {
        const checkpoints = selectedRoute.checkpoints
        const index = selectedCheckpoint ? checkpoints.indexOf(selectedCheckpoint) : -1
        const next = checkpoints[Math.min(Math.max(index + direction, 0), checkpoints.length - 1)]
        if (next)
          setSelection({ planId: plan.id, routeId: selectedRoute.id, checkpointId: next.id })
      },
    }
  }, [plan, current.routeId, current.checkpointId])

  return <RouteSelectionContextProvider value={value}>{children}</RouteSelectionContextProvider>
}
