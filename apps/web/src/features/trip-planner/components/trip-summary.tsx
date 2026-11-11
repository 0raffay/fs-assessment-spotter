import { CalendarIcon, PencilIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatDate, formatNumber, formatClock, formatZone } from '@/lib/format'
import type { TripRequest } from '@/types'

import { RouteConnector } from './route-connector'

interface TripSummaryProps {
  request: TripRequest
  onEdit: () => void
}

/** The planned trip, collapsed (DESIGN.md › trip-summary). */
export function TripSummary({ request, onEdit }: TripSummaryProps) {
  const { origin, destination, departureAt, loadWeightLb, intervalMiles } = request
  const tz = origin.timeZone

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-3">
        <RouteConnector inset={5} />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 text-[15px] tracking-[-0.1px]">
          <span className="truncate">
            {origin.name}, {origin.region}
          </span>
          <span className="truncate">
            {destination.name}, {destination.region}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={onEdit}
          className="h-9 self-center rounded-lg px-3 text-[13px] active:scale-95"
        >
          <PencilIcon className="size-3.5" strokeWidth={1.75} />
          Edit
        </Button>
      </div>
      <ul
        aria-label="Trip settings"
        className="text-ink-muted flex flex-wrap gap-1.5 text-[13px] tabular-nums"
      >
        <li className="bg-surface-2 flex h-[30px] items-center gap-1.5 rounded-[10px] px-2.5">
          <CalendarIcon className="text-ink-subtle size-3.5" strokeWidth={1.75} />
          {formatDate(departureAt, tz)} · {formatClock(departureAt, tz)}{' '}
          {formatZone(departureAt, tz)}
        </li>
        <li className="bg-surface-2 flex h-[30px] items-center rounded-[10px] px-2.5">
          {formatNumber(loadWeightLb)} lb
        </li>
        <li className="bg-surface-2 flex h-[30px] items-center rounded-[10px] px-2.5">
          Every {intervalMiles} mi
        </li>
      </ul>
    </div>
  )
}
