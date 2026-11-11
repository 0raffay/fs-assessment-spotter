import type { ReactNode } from 'react'

export type StatusTone = 'ok' | 'pending' | 'error' | 'idle'

export interface StatusInfo {
  tone: StatusTone
  label: string
}

export interface AppShellProps {
  /** Left side of the header (the trip chip). */
  headerStart?: ReactNode
  /** Status shown before the header actions. */
  status?: StatusInfo
  /** Whether there is something worth sharing (enables Share). */
  canShare: boolean
  /** The map frame's content: the map plus everything that floats over it. */
  children: ReactNode
}
