import type { ReactNode } from 'react'
import { MapProvider } from 'react-map-gl/maplibre'

import { AppShell, type StatusInfo } from '@/features/app-shell'
import { CheckpointList, RiskProfileDock } from '@/features/checkpoints'
import {
  ForecastDock,
  ForecastProvider,
  HeatmapLayer,
  hourOf,
  useForecast,
  useHeatmap,
} from '@/features/forecast'
import { TripMap, type MapStatus } from '@/features/map'
import { MapToolsOverlay, MapToolsProvider, useMapTools } from '@/features/map-tools'
import {
  RouteList,
  RouteListError,
  RouteListSkeleton,
  RouteSelectionProvider,
  useRouteSelection,
  useTripPlan,
} from '@/features/routes'
import { useElementHeight } from '@/hooks/use-element-height'
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

/** The single screen: header, map frame, and everything floating over the map. */
export function TripPlannerPage() {
  return (
    <TripPlannerProvider>
      <MapProvider>
        <MapToolsProvider>
          <PlannerScreen />
        </MapToolsProvider>
      </MapProvider>
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
  const tools = useMapTools()
  const heatmapQuery = useHeatmap(plan)
  const compact = layout !== 'desktop'
  // The bottom dock holds the risk profile (desktop) or the forecast panel/chip, never both.
  const profileOpen = !compact && tools.isProfileOpen
  // Measured, not assumed: the map keeps routes clear of whatever the dock really covers.
  const [forecastRef, forecastHeight] = useElementHeight<HTMLDivElement>()
  const [profileRef, profileHeight] = useElementHeight<HTMLElement>()
  const dockHeight = profileOpen ? profileHeight : forecastHeight
  const padding = useMapPadding(dockHeight, tools.activePanel !== null)
  const dockStyle = bottomDockStyle(layout, isPanelOpen, sheetSnap)

  const status: StatusInfo = {
    tone: 'ok',
    label: `Forecast updated ${formatClock(plan.forecastIssuedAt, localTimeZone())}`,
  }

  return (
    <AppShell
      headerStart={<TripChip compact={compact} />}
      canShare={request !== null}
      status={status}
    >
      <TripMap
        padding={padding}
        status="ready"
        basemap={tools.basemap}
        layers={tools.layers}
        cardPlacement={layout === 'desktop' ? 'popup' : 'docked'}
      >
        {heatmapQuery.data ? (
          <HeatmapLayer
            heatmap={heatmapQuery.data}
            hour={forecast.hour}
            measure={tools.heatmap.measure}
            opacity={tools.heatmap.opacity}
            visible={tools.heatmap.visible}
            beforeId="route-lines-alternate"
          />
        ) : null}
      </TripMap>
      <MapToolsOverlay
        compact={compact}
        fitPadding={padding}
        extraPanels={{
          checkpoints: (
            <CheckpointList
              onClose={tools.closePanel}
              onPicked={compact ? tools.closePanel : undefined}
            />
          ),
        }}
      />
      <TripPlannerPanel
        results={
          <RouteList
            variant={layout === 'phone' && sheetSnap === 'peek' ? 'peek' : 'full'}
            compact={compact}
          />
        }
      />
      {profileOpen ? null : (
        <ForecastDock
          heatmap={heatmapQuery.data}
          isLoading={heatmapQuery.isPending}
          departureAt={selectedRoute.departureAt}
          arrivalAt={selectedRoute.arrivalAt}
          timeZone={plan.request.origin.timeZone}
          compact={compact}
          style={dockStyle}
          ref={forecastRef}
        />
      )}
      <RiskProfileDock
        open={profileOpen}
        onClose={() => tools.setProfileOpen(false)}
        style={dockStyle}
        ref={profileRef}
      />
      <SheetAutoPeek />
    </AppShell>
  )
}
