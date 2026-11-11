import { BanIcon } from 'lucide-react'
import { Marker } from 'react-map-gl/maplibre'

import { formatClock, formatNumber } from '@/lib/format'
import { RISK_META } from '@/lib/risk'
import { cn } from '@/lib/utils'
import type { Checkpoint, CheckpointId, Place, Route, RouteId } from '@/types'

import { lineMidpoint } from '../lib/geojson'

/** Origin (open circle) and destination (filled square) with pill labels. */
export function PlacePins({ origin, destination }: { origin: Place; destination: Place }) {
  return (
    <>
      {[origin, destination].map((place, i) => (
        <Marker
          key={place.id}
          longitude={place.coordinates[0]}
          latitude={place.coordinates[1]}
          anchor="left"
          offset={[-8, 0]}
        >
          <span className="pointer-events-none flex items-center gap-2">
            <span
              className={cn(
                'size-4 shrink-0',
                i === 0
                  ? 'bg-canvas border-ink rounded-full border-[3px]'
                  : 'bg-ink rounded-[5px] shadow-[0_0_0_3px_var(--canvas)]',
              )}
            />
            <span className="bg-canvas/80 rounded-full px-2.5 py-1 text-[13px] font-medium whitespace-nowrap backdrop-blur-sm">
              {place.name}, {place.region}
            </span>
          </span>
        </Marker>
      ))}
    </>
  )
}

/** Numbered tags on each route line, matching the route cards. */
export function RouteTags({
  routes,
  selectedId,
  onSelect,
}: {
  routes: readonly Route[]
  selectedId: RouteId
  onSelect: (id: RouteId) => void
}) {
  return (
    <>
      {routes.map((route) => {
        const [lng, lat] = lineMidpoint(route.geometry, 0.42 + route.rank * 0.04)
        const selected = route.id === selectedId
        return (
          <Marker key={route.id} longitude={lng} latitude={lat}>
            <button
              type="button"
              aria-label={`Route ${route.rank}${selected ? ', selected' : ''}`}
              aria-pressed={selected}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(route.id)
              }}
              className={cn(
                'focus-visible:ring-ring/50 flex size-6 items-center justify-center rounded-[9px] text-xs font-medium shadow-[0_0_0_3px_var(--canvas)] transition-transform duration-150 outline-none hover:scale-110 focus-visible:ring-3',
                selected ? 'bg-primary text-primary-foreground' : 'bg-surface-4 text-ink-muted',
              )}
            >
              {route.rank}
            </button>
          </Marker>
        )
      })}
    </>
  )
}

interface CheckpointMarkersProps {
  checkpoints: readonly Checkpoint[]
  selectedId: CheckpointId | null
  onSelect: (id: CheckpointId) => void
}

/** One button per checkpoint on the selected route, colored by its risk at the ETA. */
export function CheckpointMarkers({ checkpoints, selectedId, onSelect }: CheckpointMarkersProps) {
  return (
    <>
      {checkpoints.map((checkpoint, i) => {
        const { forecast } = checkpoint
        const level = forecast.status === 'available' ? forecast.level : null
        const selected = checkpoint.id === selectedId
        const label = `Checkpoint ${i + 1}, mile ${formatNumber(checkpoint.mile)}, ${level ? `${RISK_META[level].label} risk` : 'no forecast'}, ETA ${formatClock(checkpoint.eta, checkpoint.timeZone)}`

        return (
          <Marker
            key={checkpoint.id}
            longitude={checkpoint.coordinates[0]}
            latitude={checkpoint.coordinates[1]}
            style={{ zIndex: selected ? 2 : 1 }}
          >
            <button
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(checkpoint.id)
              }}
              style={
                {
                  animationDelay: `${0.4 + i * 0.03}s`,
                  ...(level ? { '--pulse-color': `var(${RISK_META[level].cssVar})` } : {}),
                } as React.CSSProperties
              }
              className={cn(
                'animate-in fade-in zoom-in-50 fill-mode-both flex items-center justify-center rounded-full outline-none',
                'transition-transform duration-150 hover:scale-140 focus-visible:scale-140',
                level ? RISK_META[level].bgClass : 'bg-ink-tertiary',
                selected
                  ? 'size-4 animate-[sr-pulse-ring_1.8s_ease-out_infinite]'
                  : 'size-[11px] shadow-[0_0_0_2px_var(--canvas)]',
              )}
            >
              {level === 'no_travel' && selected ? (
                <BanIcon className="text-canvas size-2.5" strokeWidth={3} />
              ) : null}
            </button>
          </Marker>
        )
      })}
    </>
  )
}
