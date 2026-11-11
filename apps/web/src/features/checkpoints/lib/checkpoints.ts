import { atLeast } from '@/lib/risk'
import type { Checkpoint, Route } from '@/types'

import type { CheckpointFilter, ProfileSegment } from '../types'

/** Checkpoints that pass the filter. Ones without a forecast only show under "All". */
export function filterCheckpoints(
  checkpoints: readonly Checkpoint[],
  filter: CheckpointFilter,
): Checkpoint[] {
  if (filter === 'all') return [...checkpoints]
  const levels = atLeast(filter)
  return checkpoints.filter(
    (checkpoint) =>
      checkpoint.forecast.status === 'available' && levels.includes(checkpoint.forecast.level),
  )
}

/** How many checkpoints pass each filter, for the segment labels. */
export function countByFilter(
  checkpoints: readonly Checkpoint[],
): Record<CheckpointFilter, number> {
  return {
    all: checkpoints.length,
    moderate: filterCheckpoints(checkpoints, 'moderate').length,
    high: filterCheckpoints(checkpoints, 'high').length,
  }
}

/**
 * A route as strip segments scaled against `scaleMiles` (the longest route), so routes of different
 * lengths line up mile for mile.
 */
export function profileSegments(
  route: Route,
  scaleMiles: number,
): ProfileSegment<Checkpoint['id']>[] {
  const scale = scaleMiles > 0 ? scaleMiles : 1
  return route.checkpoints.map((checkpoint) => {
    const end = Math.min(checkpoint.mile + checkpoint.segmentMiles, route.distanceMiles)
    return {
      id: checkpoint.id,
      start: checkpoint.mile / scale,
      width: Math.max(end - checkpoint.mile, 0) / scale,
      level: checkpoint.forecast.status === 'available' ? checkpoint.forecast.level : null,
    }
  })
}

/** The longest route's distance: the shared scale of the profile. */
export function longestRoute(routes: readonly Route[]): number {
  return routes.reduce((max, route) => Math.max(max, route.distanceMiles), 0)
}
