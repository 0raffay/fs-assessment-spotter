import { api } from '@/lib/api'

export type HealthStatus = { status: string }

/** HTTP calls for the health feature. Static methods only; uses the shared axios agent. */
export class HealthService {
  static async getStatus(): Promise<HealthStatus> {
    const { data } = await api.get<HealthStatus>('/health/')
    return data
  }
}
