import type { CSSProperties } from 'react'

import type { SheetSnap } from '../types'

export type LayoutKind = 'desktop' | 'tablet' | 'phone'

/** Phone sheet heights, shared by the sheet and everything that floats above it. */
export const SHEET_HEIGHT: Record<SheetSnap, string> = {
  peek: '168px',
  half: 'min(460px, 58%)',
  full: 'calc(100% - 16px)',
}

/** Where the bottom dock (forecast chip/panel) sits inside the map frame for each layout. */
export function bottomDockStyle(
  layout: LayoutKind,
  isPanelOpen: boolean,
  sheetSnap: SheetSnap,
): CSSProperties {
  // Collapsed, the planner is a 56px rail at left 16, so the dock starts after it.
  if (layout === 'desktop') return { left: isPanelOpen ? 392 : 84, right: 76, bottom: 16 }
  if (layout === 'tablet') return { left: 404, right: 12, bottom: 12 }
  return { left: 8, right: 8, bottom: `calc(${SHEET_HEIGHT[sheetSnap]} + 16px)` }
}
