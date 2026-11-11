import type { Checkpoint, CheckpointId, Route, RouteId, TripPlan } from '@/types'

export type RouteListVariant = 'full' | 'peek'

/** Which route and checkpoint are selected; shared by the list, the map and the checkpoint tools. */
export interface RouteSelectionState {
  plan: TripPlan
  selectedRoute: Route
  selectRoute: (id: RouteId) => void
  selectedCheckpoint: Checkpoint | null
  selectCheckpoint: (id: CheckpointId | null) => void
  /** Steps to the previous/next checkpoint on the selected route. */
  stepCheckpoint: (direction: -1 | 1) => void
}
