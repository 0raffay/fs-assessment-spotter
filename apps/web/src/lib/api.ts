/** Base URL for the Django API. Dev uses the Vite proxy; prod sets VITE_API_BASE_URL. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = response.headers.get('content-type')?.includes('json')
    ? await response.json()
    : await response.text()
  if (!response.ok) throw new ApiError(response.status, body)
  return body as T
}

export const apiGet = <T>(path: string) => request<T>(path)

export const apiPost = <T>(path: string, data: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data) })
