import { AppShell } from '@/features/app-shell'

/** The single screen: header, map frame, and everything floating over the map. */
export function TripPlannerPage() {
  return (
    <AppShell canShare={false} status={{ tone: 'idle', label: 'No trip planned yet' }}>
      <div />
    </AppShell>
  )
}
