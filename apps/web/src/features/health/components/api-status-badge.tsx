import { useHealthStatus } from '../api/health.api'

export function ApiStatusBadge() {
  const health = useHealthStatus()

  const label = health.isPending ? 'checking…' : health.isError ? 'unreachable' : health.data.status

  return (
    <p className="text-sm text-slate-600">
      API status: <span className="font-medium">{label}</span>
    </p>
  )
}
