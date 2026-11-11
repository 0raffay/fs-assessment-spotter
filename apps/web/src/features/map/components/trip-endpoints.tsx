import { FlagIcon } from 'lucide-react'
import { Marker } from 'react-map-gl/maplibre'

import { formatDayClock, formatZone } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Place } from '@/types'

type EndpointKind = 'start' | 'arrive'

interface TripEndpointsProps {
  origin: Place
  destination: Place
  /** The selected route's departure and arrival, shown in each place's own time zone. */
  departureAt: string
  arrivalAt: string
}

const KIND_LABEL: Record<EndpointKind, string> = { start: 'Start', arrive: 'Arrive' }

/**
 * Where the trip starts and ends: a sky-ringed start pin and a flag pin, each with a two-line label
 * ("Start · Pueblo, CO" / "Thu 06:00 CST"). They sit above the checkpoint dots, so the first
 * checkpoint (at mile 0) hides under the start pin.
 */
export function TripEndpoints({ origin, destination, departureAt, arrivalAt }: TripEndpointsProps) {
  return (
    <>
      <EndpointMarker kind="start" place={origin} at={departureAt} />
      <EndpointMarker kind="arrive" place={destination} at={arrivalAt} />
    </>
  )
}

function EndpointMarker({ kind, place, at }: { kind: EndpointKind; place: Place; at: string }) {
  const time = `${formatDayClock(at, place.timeZone)} ${formatZone(at, place.timeZone)}`
  const label = `${KIND_LABEL[kind]}: ${place.name}, ${place.region}, ${time}`

  return (
    <Marker
      longitude={place.coordinates[0]}
      latitude={place.coordinates[1]}
      anchor="left"
      offset={[-14, 0]}
      style={{ zIndex: 3 }}
    >
      <span
        role="img"
        aria-label={label}
        data-endpoint={kind}
        className="animate-in fade-in zoom-in-75 pointer-events-none flex items-center gap-2 duration-300"
      >
        {kind === 'start' ? (
          <span
            aria-hidden
            className="bg-canvas border-primary grid size-7 shrink-0 place-items-center rounded-full border-[3px] shadow-[0_4px_14px_rgb(0_0_0/0.35)]"
          >
            <span className="bg-primary size-2.5 rounded-full" />
          </span>
        ) : (
          <span
            aria-hidden
            className="bg-ink text-canvas grid size-7 shrink-0 place-items-center rounded-[9px] shadow-[0_0_0_3px_var(--canvas),0_4px_14px_rgb(0_0_0/0.35)]"
          >
            <FlagIcon className="size-3.5" strokeWidth={2.25} />
          </span>
        )}
        <span className="border-hairline-strong bg-surface-1/90 flex flex-col rounded-xl border px-2.5 py-1 leading-tight whitespace-nowrap shadow-[0_6px_18px_rgb(0_0_0/0.25)] backdrop-blur-sm">
          <span className="text-[13px] font-medium">
            <span className={cn(kind === 'start' ? 'text-primary' : 'text-ink-subtle')}>
              {KIND_LABEL[kind]}
            </span>
            <span className="text-ink-tertiary"> · </span>
            {place.name}, {place.region}
          </span>
          <span className="text-ink-subtle text-xs tabular-nums">{time}</span>
        </span>
      </span>
    </Marker>
  )
}
