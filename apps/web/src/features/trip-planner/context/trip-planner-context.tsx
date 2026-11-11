import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { useSearchParamState } from '@/hooks/use-search-param-state'
import { tripRequestSchema, type TripRequest } from '@/types'

import type { SheetSnap, TripPlannerState } from '../types'

import { Provider, TRIP_PARAM } from './trip-planner-store'

export function TripPlannerProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useSearchParamState(TRIP_PARAM, tripRequestSchema)
  const [editing, setEditing] = useState(false)
  const [isPanelOpen, setPanelOpen] = useState(true)
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('half')

  const submit = useCallback(
    (next: TripRequest) => {
      setRequest(next)
      setEditing(false)
      setSheetSnap('half')
    },
    [setRequest],
  )

  const value = useMemo<TripPlannerState>(
    () => ({
      request,
      submit,
      isEditing: editing || request === null,
      startEditing: () => {
        setEditing(true)
        setPanelOpen(true)
        setSheetSnap('full')
      },
      cancelEditing: () => setEditing(false),
      isPanelOpen,
      setPanelOpen,
      sheetSnap,
      setSheetSnap,
    }),
    [request, submit, editing, isPanelOpen, sheetSnap],
  )

  return <Provider value={value}>{children}</Provider>
}
