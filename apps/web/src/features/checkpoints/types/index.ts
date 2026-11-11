import type { RiskLevel } from '@/types'

/** List filters: everything, or checkpoints at or above a level. */
export const CHECKPOINT_FILTERS = ['all', 'moderate', 'high'] as const
export type CheckpointFilter = (typeof CHECKPOINT_FILTERS)[number]

/** One block of a risk-profile strip: where it starts and how far it runs, both as a 0–1 share. */
export interface ProfileSegment<TId extends string = string> {
  id: TId
  start: number
  width: number
  /** `null` when the ETA is beyond the forecast range. */
  level: RiskLevel | null
}
