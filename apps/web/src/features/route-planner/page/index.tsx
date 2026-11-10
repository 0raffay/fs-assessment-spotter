import { ApiStatusBadge } from '@/features/health'

export function RoutePlannerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-slate-900">
      <img src="/logo.svg" alt="SkyRig — weather-aware truck routing" className="h-24 w-auto" />
      <ApiStatusBadge />
    </main>
  )
}
