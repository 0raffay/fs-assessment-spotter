import { XIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import { useRouteSelection } from '@/features/routes'
import { formatMiles, formatNumber } from '@/lib/format'
import { RISK_META } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { Route } from '@/types'

import { longestRoute, profileSegments } from '../lib/checkpoints'

/**
 * One strip per route, scaled to the longest route, colored by each checkpoint's risk at its ETA.
 * The selected route is taller; a marker tracks the selected checkpoint's mile across all routes.
 */
export function RiskProfile({ onClose }: { onClose: () => void }) {
  const { plan, selectedRoute, selectedCheckpoint } = useRouteSelection()
  const scale = longestRoute(plan.routes)
  const marker = selectedCheckpoint ? selectedCheckpoint.mile / scale : null

  return (
    <div className="flex flex-col gap-3 p-4 pb-3.5">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-medium tracking-[-0.2px]">Risk profile</h2>
          <span className="text-ink-subtle text-[13px]">by distance, at each checkpoint’s ETA</span>
        </div>
        <IconButton
          label="Close risk profile"
          onClick={onClose}
          icon={<XIcon className="size-4" />}
          className="text-ink-subtle size-[30px] rounded-[10px]"
        />
      </header>

      <div className="grid grid-cols-[72px_1fr_64px] items-center gap-x-3 gap-y-2">
        {plan.routes.map((route) => (
          <ProfileRow
            key={route.id}
            route={route}
            scale={scale}
            selected={route.id === selectedRoute.id}
          />
        ))}
        {/* Mile axis, aligned with the strips. */}
        <span />
        <div className="relative h-5">
          {marker !== null ? (
            <span
              className="bg-primary text-primary-foreground absolute top-0 -translate-x-1/2 rounded-full px-2 py-0.5 font-mono text-[11px] whitespace-nowrap tabular-nums transition-[left] duration-300"
              style={{ left: `${marker * 100}%` }}
            >
              mi {formatNumber(selectedCheckpoint?.mile ?? 0)}
            </span>
          ) : (
            <div className="text-ink-subtle flex justify-between font-mono text-[11px] tabular-nums">
              <span>0</span>
              <span>{formatMiles(Math.round(scale / 2))}</span>
              <span>{formatMiles(Math.round(scale))}</span>
            </div>
          )}
        </div>
        <span />
      </div>
    </div>
  )
}

function ProfileRow({
  route,
  scale,
  selected,
}: {
  route: Route
  scale: number
  selected: boolean
}) {
  const { selectedCheckpoint, selectCheckpoint, selectRoute } = useRouteSelection()
  const segments = profileSegments(route, scale)
  const marker = selectedCheckpoint ? selectedCheckpoint.mile / scale : null

  return (
    <>
      <button
        type="button"
        onClick={() => selectRoute(route.id)}
        aria-pressed={selected}
        className={cn(
          'truncate rounded-lg text-left text-[13px] transition-colors outline-none',
          'focus-visible:ring-ring/45 hover:text-ink focus-visible:ring-3',
          selected ? 'text-ink font-medium' : 'text-ink-subtle',
        )}
      >
        Route {route.rank}
      </button>
      <div
        role="group"
        aria-label={`Route ${route.rank} risk by distance`}
        className={cn('relative transition-[height] duration-300', selected ? 'h-4' : 'h-2')}
      >
        {segments.map((segment, index) => {
          const checkpoint = route.checkpoints[index]
          const label = segment.level ? RISK_META[segment.level].label : 'No forecast'
          return (
            <button
              key={segment.id}
              type="button"
              tabIndex={selected ? 0 : -1}
              aria-label={`Route ${route.rank}, mile ${formatNumber(checkpoint?.mile ?? 0)}: ${label}`}
              aria-current={segment.id === selectedCheckpoint?.id ? 'true' : undefined}
              onClick={() => selectCheckpoint(segment.id, route.id)}
              className={cn(
                'focus-visible:ring-ring absolute inset-y-0 transition-[filter,transform] outline-none first:rounded-l-full last:rounded-r-full hover:brightness-125 focus-visible:z-10 focus-visible:ring-2',
                segment.level ? RISK_META[segment.level].bgClass : 'bg-surface-4',
                !selected && 'opacity-70',
              )}
              style={{
                left: `${segment.start * 100}%`,
                width: `calc(${segment.width * 100}% - 1px)`,
              }}
            />
          )
        })}
        {marker !== null ? (
          <span
            aria-hidden
            className="bg-ink pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full transition-[left] duration-300"
            style={{ left: `${marker * 100}%` }}
          />
        ) : null}
      </div>
      <span className="text-ink-subtle text-right text-xs tabular-nums">
        {formatMiles(route.distanceMiles)}
      </span>
    </>
  )
}
