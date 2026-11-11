import axios, { AxiosError } from 'axios'

import { env } from '@/lib/env'
import { apiErrorBodySchema, type ApiErrorBody, type ApiErrorKind } from '@/types'

/**
 * The single axios agent. Feature services call it through `callEndpoint`; components never do.
 * In development `/api` is proxied to Django by Vite (or answered by MSW when mocks are on).
 */
export const api = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

/** Every failure becomes an `ApiError`, so callers handle one shape. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly body: ApiErrorBody | null

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
    body: ApiErrorBody | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.body = body
  }

  /** The best message to show a person. */
  get userMessage(): string {
    if (this.body?.detail) return this.body.detail
    switch (this.kind) {
      case 'network':
        return 'Can’t reach the server. Check your connection and try again.'
      case 'timeout':
        return 'The server took too long to respond.'
      case 'invalid_response':
        return 'The server sent data we couldn’t read.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AxiosError) {
    if (error.code === AxiosError.ECONNABORTED || error.code === 'ETIMEDOUT') {
      return new ApiError('timeout', error.message)
    }
    if (!error.response) return new ApiError('network', error.message)
    const parsed = apiErrorBodySchema.safeParse(error.response.data)
    return new ApiError(
      'http',
      `Request failed with status ${error.response.status}`,
      error.response.status,
      parsed.success ? parsed.data : null,
    )
  }
  return new ApiError('unknown', error instanceof Error ? error.message : 'Unexpected error')
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)
