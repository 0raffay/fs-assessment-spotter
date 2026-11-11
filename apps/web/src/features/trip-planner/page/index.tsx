import type { ReactNode } from 'react'

import { AppShell, type StatusInfo } from '@/features/app-shell'
import { TripMap } from '@/features/map'
import {
  RouteList,
  RouteListError,
  RouteListSkeleton,
  RouteSelectionProvider,
  useTripPlan,
} from '@/features/routes'
import { useIsDesktop } from '@/hooks/use-media-query'
import { formatClock } from '@/lib/format'
import { localTimeZone } from '@/lib/time'

import { TripChip } from '../components/trip-chip'
import { SheetAutoPeek } from '../components/sheet-auto-peek'
import { TripPlannerPanel } from '../components/trip-planner-panel'
import { TripPlannerProvider } from '../context/trip-planner-context'
import { useTripPlanner } from '../context/trip-planner-store'
import { useMapPadding } from '../hooks/use-map-padding'

/** The single screen: header, map frame, and everything floating over the map. */
export function TripPlannerPage() {
  return (
    <TripPlannerProvider>
      <PlannerScreen />
    </TripPlannerProvider>
  )
}

function PlannerScreen() {
  const { request, sheetSnap } = useTripPlanner()
  const isDesktop = useIsDesktop()
  const planQuery = useTripPlan(request)
  const plan = request ? planQuery.data : undefined
  const padding = useMapPadding()

  let results: ReactNode = null
  let status: StatusInfo = { tone: 'idle', label: 'No trip planned yet' }
  if (request && planQuery.isPending) {
    results = <RouteListSkeleton />
    status = { tone: 'pending', label: 'Planning routes…' }
  } else if (request && planQuery.isError) {
    results = (
      <RouteListError
        error={planQuery.error}
        onRetry={() => void planQuery.refetch()}
        retrying={planQuery.isFetching}
      />
    )
    status = { tone: 'error', label: 'Couldn’t plan routes' }
  } else if (plan) {
    results = (
      <RouteList
        variant={!isDesktop && sheetSnap === 'peek' ? 'peek' : 'full'}
        compact={!isDesktop}
      />
    )
    status = {
      tone: 'ok',
      label: `Forecast updated ${formatClock(plan.forecastIssuedAt, localTimeZone())}`,
    }
  }

  const screen = (
    <AppShell
      headerStart={<TripChip compact={!isDesktop} />}
      canShare={request !== null}
      status={status}
    >
      <TripMap
        padding={padding}
        status={
          plan ? 'ready' : request && planQuery.isPending ? 'loading' : request ? 'ready' : 'idle'
        }
        cardPlacement={isDesktop ? 'popup' : 'docked'}
      />
      <TripPlannerPanel results={results} />
      <SheetAutoPeek />
    </AppShell>
  )

  return plan ? <RouteSelectionProvider plan={plan}>{screen}</RouteSelectionProvider> : screen
}
