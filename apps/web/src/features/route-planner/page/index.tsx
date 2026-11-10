import { ApiStatusBadge } from '@/features/health'

export function RoutePlannerPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <img src="/logo.svg" alt="SkyRig — weather-aware truck routing" className="h-24 w-auto" />
      <ApiStatusBadge />
    </main>
  )
}
