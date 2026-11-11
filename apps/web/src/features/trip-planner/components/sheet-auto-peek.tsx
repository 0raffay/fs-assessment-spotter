import { useEffect } from 'react'

import { useOptionalForecast } from '@/features/forecast'
import { useOptionalMapTools } from '@/features/map-tools'
import { useOptionalRouteSelection } from '@/features/routes'
import { useIsDesktop } from '@/hooks/use-media-query'

import { useTripPlanner } from '../context/trip-planner-store'

/** On phones, opening a checkpoint, the forecast or a map tool panel drops the sheet to peek so the map has room. */
export function SheetAutoPeek() {
  const isDesktop = useIsDesktop()
  const selection = useOptionalRouteSelection()
  const { setSheetSnap } = useTripPlanner()
  const checkpointId = selection?.selectedCheckpoint?.id ?? null
  const forecastOpen = useOptionalForecast()?.isOpen ?? false
  const toolPanelOpen = (useOptionalMapTools()?.activePanel ?? null) !== null

  useEffect(() => {
    if (!isDesktop && (checkpointId || forecastOpen || toolPanelOpen)) setSheetSnap('peek')
  }, [checkpointId, forecastOpen, toolPanelOpen, isDesktop, setSheetSnap])

  return null
}
