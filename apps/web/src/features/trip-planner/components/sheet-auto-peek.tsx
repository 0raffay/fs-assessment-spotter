import { useEffect } from 'react'

import { useOptionalRouteSelection } from '@/features/routes'
import { useIsDesktop } from '@/hooks/use-media-query'

import { useTripPlanner } from '../context/trip-planner-store'

/** On phones, opening a checkpoint drops the sheet to peek so the docked card has room. */
export function SheetAutoPeek() {
  const isDesktop = useIsDesktop()
  const selection = useOptionalRouteSelection()
  const { setSheetSnap } = useTripPlanner()
  const checkpointId = selection?.selectedCheckpoint?.id ?? null

  useEffect(() => {
    if (!isDesktop && checkpointId) setSheetSnap('peek')
  }, [checkpointId, isDesktop, setSheetSnap])

  return null
}
