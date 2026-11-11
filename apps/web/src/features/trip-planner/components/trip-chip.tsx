import { ChevronDownIcon, RouteIcon } from 'lucide-react'

import { IconButton } from '@/components/icon-button'
import { Button } from '@/components/ui/button'
import { formatClock, formatNumber, formatWeekday } from '@/lib/format'

import { useTripPlanner } from '../context/trip-planner-store'

/** Header-left summary of the trip; opens the planner. */
export function TripChip({ compact }: { compact: boolean }) {
  const { request, setPanelOpen, isPanelOpen, setSheetSnap, startEditing } = useTripPlanner()

  function open() {
    if (!request) startEditing()
    else if (compact) setSheetSnap('half')
    else setPanelOpen(!isPanelOpen)
  }

  if (compact) {
    return (
      <IconButton
        label="Open trip planner"
        onClick={open}
        icon={<RouteIcon className="size-[19px]" strokeWidth={1.75} />}
      />
    )
  }

  return (
    <Button
      variant="outline"
      onClick={open}
      aria-label={
        request
          ? `Trip ${request.origin.name} to ${request.destination.name}; toggle planner`
          : 'Plan a new trip'
      }
      aria-expanded={request ? isPanelOpen : undefined}
      className="h-10 max-w-full gap-2.5 rounded-full pr-3.5 pl-3 font-normal transition-[background-color,border-color,transform] active:scale-[0.97]"
    >
      <RouteIcon className="text-primary size-4" strokeWidth={1.75} />
      {request ? (
        <>
          <span className="truncate text-sm">
            {request.origin.name}, {request.origin.region} → {request.destination.name},{' '}
            {request.destination.region}
          </span>
          <span className="text-ink-subtle hidden text-[13px] whitespace-nowrap tabular-nums 2xl:inline">
            {formatWeekday(request.departureAt, request.origin.timeZone)}{' '}
            {formatClock(request.departureAt, request.origin.timeZone)} ·{' '}
            {formatNumber(request.loadWeightLb)} lb
          </span>
        </>
      ) : (
        <span className="text-sm">New trip</span>
      )}
      <ChevronDownIcon className="text-ink-subtle size-3.5" strokeWidth={1.75} />
    </Button>
  )
}
