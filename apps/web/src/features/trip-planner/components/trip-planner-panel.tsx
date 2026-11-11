import type { ReactNode } from 'react'

import { useIsDesktop } from '@/hooks/use-media-query'

import { useTripPlanner } from '../context/trip-planner-store'

import { PlannerSurface } from './planner-surface'
import { TripForm } from './trip-form'
import { TripSummary } from './trip-summary'

interface TripPlannerPanelProps {
  /** Shown under the trip summary once a trip is planned (the route list). */
  results: ReactNode
}

/** The planner: the form while editing, otherwise the trip summary plus results. */
export function TripPlannerPanel({ results }: TripPlannerPanelProps) {
  const { request, isEditing, startEditing } = useTripPlanner()
  const isDesktop = useIsDesktop()

  if (isEditing || !request) {
    return (
      <PlannerSurface title="Plan a trip">
        <p className="text-ink-subtle text-sm leading-relaxed">
          Compare three routes by the weather the truck meets at each checkpoint.
        </p>
        <TripForm compact={!isDesktop} />
      </PlannerSurface>
    )
  }

  return (
    <PlannerSurface title="Trip">
      <TripSummary request={request} onEdit={startEditing} />
      <span aria-hidden className="bg-hairline -mx-4 h-px shrink-0" />
      {results}
    </PlannerSurface>
  )
}
