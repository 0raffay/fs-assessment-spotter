import { StarIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import { formatDuration, formatMiles } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Route } from '@/types'

import { useOptionalRouteSelection } from '../context/route-selection-store'

import { RiskStrip } from './risk-strip'

/**
 * The routes as numbered buttons for the collapsed planner rail: pick a route without expanding.
 * Each shows its risk by distance as a tiny strip; the recommended one wears a star. Renders
 * nothing before a plan exists.
 */
export function RouteRail() {
  const selection = useOptionalRouteSelection()
  if (!selection) return null
  const { plan, selectedRoute, selectRoute } = selection

  return (
    <div role="group" aria-label="Routes" className="flex flex-col items-center gap-1.5">
      {plan.routes.map((route) => (
        <RouteRailButton
          key={route.id}
          route={route}
          selected={route.id === selectedRoute.id}
          onSelect={() => selectRoute(route.id)}
        />
      ))}
    </div>
  )
}

function RouteRailButton({
  route,
  selected,
  onSelect,
}: {
  route: Route
  selected: boolean
  onSelect: () => void
}) {
  const label = [
    `Route ${route.rank}`,
    route.name,
    formatDuration(route.durationMinutes),
    formatMiles(route.distanceMiles),
    route.isRecommended ? 'recommended' : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <span className="relative">
      <IconButton
        label={label}
        tooltipSide="right"
        pressed={selected}
        onClick={onSelect}
        className={cn(
          'flex size-11 flex-col gap-1 rounded-[14px] text-[13px] font-medium',
          selected &&
            'bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary hover:text-primary-foreground hover:brightness-110',
        )}
        icon={
          <>
            <span className="leading-none tabular-nums">{route.rank}</span>
            <RiskStrip riskMiles={route.riskMiles} className="h-1 w-6 gap-px" />
          </>
        }
      />
      {route.isRecommended ? (
        <StarIcon
          aria-hidden
          className="fill-primary text-primary pointer-events-none absolute -top-1 right-0 size-3.5 drop-shadow-[0_0_2px_var(--surface-1)]"
        />
      ) : null}
    </span>
  )
}
