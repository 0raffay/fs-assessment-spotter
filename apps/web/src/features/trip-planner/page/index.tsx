import type { ReactNode } from 'react'

import { AppShell, type StatusInfo } from '@/features/app-shell'
import {
  ForecastDock,
  ForecastProvider,
  HeatmapLayer,
  hourOf,
  useForecast,
  useHeatmap,
} from '@/features/forecast'
import { TripMap, type MapStatus } from '@/features/map'
import {
  RouteList,
  RouteListError,
  RouteListSkeleton,
  RouteSelectionProvider,
  useRouteSelection,
  useTripPlan,
} from '@/features/routes'
import { useIsDesktop, useMediaQuery } from '@/hooks/use-media-query'
import { formatClock } from '@/lib/format'
import { localTimeZone } from '@/lib/time'
import type { TripPlan } from '@/types'

import { SheetAutoPeek } from '../components/sheet-auto-peek'
import { TripChip } from '../components/trip-chip'
import { TripPlannerPanel } from '../components/trip-planner-panel'
import { TripPlannerProvider } from '../context/trip-planner-context'
import { useTripPlanner } from '../context/trip-planner-store'
import { useMapPadding } from '../hooks/use-map-padding'
import { bottomDockStyle, type LayoutKind } from '../lib/layout'

/** Height (px) the forecast takes along the bottom of the map: open panel (full / compact) or chip. */
const FORECAST_PANEL_HEIGHT = { desktop: 214, compact: 170 } as const
const FORECAST_CHIP_HEIGHT = 58

/** The single screen: header, map frame, and everything floating over the map. */
export function TripPlannerPage() {
  return (
    <TripPlannerProvider>
      <PlannerScreen />
    </TripPlannerProvider>
  )
}

function useLayoutKind(): LayoutKind {
  const isDesktop = useIsDesktop()
  const isTablet = useMediaQuery('(min-width: 768px)')
  return isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone'
}

/** Before a plan exists: form, loading or error, over an empty map. */
function PlannerScreen() {
  const { request } = useTripPlanner()
  const layout = useLayoutKind()
  const planQuery = useTripPlan(request)
  const plan = request ? planQuery.data : undefined
  const padding = useMapPadding()

  if (plan) {
    return (
      <RouteSelectionProvider plan={plan}>
        <ForecastProvider
          key={plan.id}
          initialHour={hourOf(plan.forecastIssuedAt, plan.request.departureAt)}
          initiallyOpen={layout === 'desktop'}
        >
          <PlanScreen plan={plan} layout={layout} />
        </ForecastProvider>
      </RouteSelectionProvider>
    )
  }

  let results: ReactNode = null
  let status: StatusInfo = { tone: 'idle', label: 'No trip planned yet' }
  let mapStatus: MapStatus = 'idle'
  if (request && planQuery.isError) {
    results = (
      <RouteListError
        error={planQuery.error}
        onRetry={() => void planQuery.refetch()}
        retrying={planQuery.isFetching}
      />
    )
    status = { tone: 'error', label: 'Couldn’t plan routes' }
    mapStatus = 'ready'
  } else if (request) {
    results = <RouteListSkeleton />
    status = { tone: 'pending', label: 'Planning routes…' }
    mapStatus = 'loading'
  }

  return (
    <AppShell
      headerStart={<TripChip compact={layout !== 'desktop'} />}
      canShare={request !== null}
      status={status}
    >
      <TripMap
        padding={padding}
        status={mapStatus}
        cardPlacement={layout === 'desktop' ? 'popup' : 'docked'}
      />
      <TripPlannerPanel results={results} />
    </AppShell>
  )
}

/** With a plan: routes, map with heatmap, and the forecast dock. */
function PlanScreen({ plan, layout }: { plan: TripPlan; layout: LayoutKind }) {
  const { request, isPanelOpen, sheetSnap } = useTripPlanner()
  const { selectedRoute } = useRouteSelection()
  const forecast = useForecast()
  const heatmapQuery = useHeatmap(plan)
  const dockHeight = forecast.isOpen
    ? FORECAST_PANEL_HEIGHT[layout === 'desktop' ? 'desktop' : 'compact']
    : FORECAST_CHIP_HEIGHT
  const padding = useMapPadding(dockHeight)

  const status: StatusInfo = {
    tone: 'ok',
    label: `Forecast updated ${formatClock(plan.forecastIssuedAt, localTimeZone())}`,
  }

  return (
    <AppShell
      headerStart={<TripChip compact={layout !== 'desktop'} />}
      canShare={request !== null}
      status={status}
    >
      <TripMap
        padding={padding}
        status="ready"
        cardPlacement={layout === 'desktop' ? 'popup' : 'docked'}
      >
        {heatmapQuery.data ? (
          <HeatmapLayer
            heatmap={heatmapQuery.data}
            hour={forecast.hour}
            beforeId="route-lines-alternate"
          />
        ) : null}
      </TripMap>
      <TripPlannerPanel
        results={
          <RouteList
            variant={layout === 'phone' && sheetSnap === 'peek' ? 'peek' : 'full'}
            compact={layout !== 'desktop'}
          />
        }
      />
      <ForecastDock
        heatmap={heatmapQuery.data}
        isLoading={heatmapQuery.isPending}
        departureAt={selectedRoute.departureAt}
        arrivalAt={selectedRoute.arrivalAt}
        timeZone={plan.request.origin.timeZone}
        compact={layout !== 'desktop'}
        style={bottomDockStyle(layout, isPanelOpen, sheetSnap)}
      />
      <SheetAutoPeek />
    </AppShell>
  )
}
