import { AppShell } from '@/features/app-shell'
import { useIsDesktop } from '@/hooks/use-media-query'

import { TripChip } from '../components/trip-chip'
import { TripPlannerPanel } from '../components/trip-planner-panel'
import { TripPlannerProvider } from '../context/trip-planner-context'
import { useTripPlanner } from '../context/trip-planner-store'

/** The single screen: header, map frame, and everything floating over the map. */
export function TripPlannerPage() {
  return (
    <TripPlannerProvider>
      <PlannerScreen />
    </TripPlannerProvider>
  )
}

function PlannerScreen() {
  const { request } = useTripPlanner()
  const isDesktop = useIsDesktop()

  return (
    <AppShell
      headerStart={<TripChip compact={!isDesktop} />}
      canShare={request !== null}
      status={{ tone: 'idle', label: request ? 'Trip ready' : 'No trip planned yet' }}
    >
      <TripPlannerPanel results={null} />
    </AppShell>
  )
}
