import type { MapPadding } from '@/features/map'
import { useIsDesktop, useMediaQuery } from '@/hooks/use-media-query'

import { useTripPlanner } from '../context/trip-planner-store'
import type { SheetSnap } from '../types'

const SHEET_BOTTOM: Record<SheetSnap, number> = { peek: 200, half: 360, full: 360 }

/**
 * How much of the map frame the floating UI covers, so routes are fitted into the clear area
 * (DESIGN.md: "the map content is padded so routes never sit under a panel").
 *
 * @param bottomDock height (px) of whatever floats along the bottom on desktop (e.g. the forecast).
 */
export function useMapPadding(bottomDock = 0): MapPadding {
  const isDesktop = useIsDesktop()
  const isTablet = useMediaQuery('(min-width: 768px)') && !isDesktop
  const { isPanelOpen, sheetSnap } = useTripPlanner()

  if (isDesktop) {
    return { top: 64, right: 96, bottom: 48 + bottomDock, left: isPanelOpen ? 416 : 56 }
  }
  if (isTablet) return { top: 72, right: 80, bottom: 48 + bottomDock, left: 412 }
  return { top: 64, right: 64, bottom: SHEET_BOTTOM[sheetSnap] + bottomDock, left: 32 }
}
