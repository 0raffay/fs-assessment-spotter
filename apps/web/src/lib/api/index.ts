import axios, { AxiosError } from 'axios'

/**
 * The single axios agent for the app. Feature services call this; components never do.
 * In development `/api` is proxied to Django by Vite. In production set VITE_API_BASE_URL.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

/** Error type every failed request is converted to, so callers handle one shape. */
export class ApiError extends Error {
  readonly status: number | null
  readonly data: unknown

  constructor(message: string, status: number | null, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null
    const message = status ? `Request failed with status ${status}` : error.message
    return new ApiError(message, status, error.response?.data)
  }
  return new ApiError('Unexpected error', null, error)
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
