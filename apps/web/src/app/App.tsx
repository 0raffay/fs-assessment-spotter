import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/lib/api'

type Health = { status: string }

export function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<Health>('/health/'),
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-slate-900">
      <h1 className="text-2xl font-semibold">Weather-Aware Truck Routing</h1>
      <p className="text-sm text-slate-600">
        API status:{' '}
        <span className="font-medium">
          {health.isPending ? 'checking…' : health.isError ? 'unreachable' : health.data.status}
        </span>
      </p>
    </main>
  )
}
