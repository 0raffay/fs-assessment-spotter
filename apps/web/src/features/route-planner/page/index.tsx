import { ApiStatusBadge } from '@/features/health'

export function RoutePlannerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-slate-900">
      <h1 className="text-2xl font-semibold">Weather-Aware Truck Routing</h1>
      <ApiStatusBadge />
    </main>
  )
}
