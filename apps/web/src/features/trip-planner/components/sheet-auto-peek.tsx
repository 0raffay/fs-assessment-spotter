import { useEffect } from 'react'

import { useOptionalForecast } from '@/features/forecast'
import { useOptionalRouteSelection } from '@/features/routes'
import { useIsDesktop } from '@/hooks/use-media-query'

import { useTripPlanner } from '../context/trip-planner-store'

/** On phones, opening a checkpoint or the forecast drops the sheet to peek so the map has room. */
export function SheetAutoPeek() {
  const isDesktop = useIsDesktop()
  const selection = useOptionalRouteSelection()
  const { setSheetSnap } = useTripPlanner()
  const checkpointId = selection?.selectedCheckpoint?.id ?? null
  const forecastOpen = useOptionalForecast()?.isOpen ?? false

  useEffect(() => {
    if (!isDesktop && (checkpointId || forecastOpen)) setSheetSnap('peek')
  }, [checkpointId, forecastOpen, isDesktop, setSheetSnap])

  return null
}
