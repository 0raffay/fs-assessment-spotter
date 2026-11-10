import { useHealthStatus } from '../api/health.api'

export function ApiStatusBadge() {
  const health = useHealthStatus()

  const label = health.isPending ? 'checking…' : health.isError ? 'unreachable' : health.data.status

  return (
    <p className="text-muted-foreground text-sm">
      API status: <span className="text-foreground font-medium">{label}</span>
    </p>
  )
}
