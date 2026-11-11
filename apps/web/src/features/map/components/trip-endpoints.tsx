import { FlagIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Marker, useMap } from 'react-map-gl/maplibre'

import { formatDayClock, formatZone } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Place } from '@/types'

type EndpointKind = 'start' | 'arrive'
type LabelSide = 'left' | 'right'

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

/**
 * Which side of its pin a label fits on: the right by default, the left when the pin sits in the
 * right half of the map (so labels never run off the edge, e.g. on phones). Re-checked after moves.
 */
function useLabelSide([lng, lat]: Place['coordinates']): LabelSide {
  const { current: map } = useMap()
  const [side, setSide] = useState<LabelSide>('right')

  useEffect(() => {
    if (!map) return
    const update = () => {
      const { x } = map.project([lng, lat])
      setSide(x > map.getContainer().clientWidth / 2 ? 'left' : 'right')
    }
    update()
    map.on('moveend', update)
    map.on('resize', update)
    return () => {
      map.off('moveend', update)
      map.off('resize', update)
    }
  }, [map, lng, lat])

  return side
}

function EndpointMarker({ kind, place, at }: { kind: EndpointKind; place: Place; at: string }) {
  const side = useLabelSide(place.coordinates)
  const time = `${formatDayClock(at, place.timeZone)} ${formatZone(at, place.timeZone)}`
  const label = `${KIND_LABEL[kind]}: ${place.name}, ${place.region}, ${time}`

  // The marker is anchored at the pin's center and never changes anchor (react-map-gl only reads
  // `anchor` on creation); the label is positioned beside the pin with CSS, so flipping sides is
  // only a class change.
  return (
    <Marker longitude={place.coordinates[0]} latitude={place.coordinates[1]} style={{ zIndex: 3 }}>
      <span
        role="img"
        aria-label={label}
        data-endpoint={kind}
        data-label-side={side}
        className="animate-in fade-in zoom-in-75 pointer-events-none relative block size-7 duration-300"
      >
        {kind === 'start' ? (
          <span
            aria-hidden
            className="bg-canvas border-primary grid size-7 place-items-center rounded-full border-[3px] shadow-[0_4px_14px_rgb(0_0_0/0.35)]"
          >
            <span className="bg-primary size-2.5 rounded-full" />
          </span>
        ) : (
          <span
            aria-hidden
            className="bg-ink text-canvas grid size-7 place-items-center rounded-[9px] shadow-[0_0_0_3px_var(--canvas),0_4px_14px_rgb(0_0_0/0.35)]"
          >
            <FlagIcon className="size-3.5" strokeWidth={2.25} />
          </span>
        )}
        <span
          className={cn(
            'border-hairline-strong bg-surface-1/90 absolute top-1/2 flex -translate-y-1/2 flex-col rounded-xl border px-2.5 py-1 leading-tight whitespace-nowrap shadow-[0_6px_18px_rgb(0_0_0/0.25)] backdrop-blur-sm',
            side === 'right' ? 'left-full ml-2' : 'right-full mr-2',
          )}
        >
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
