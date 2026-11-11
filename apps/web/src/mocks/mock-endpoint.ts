import { delay, http, HttpResponse, type HttpHandler } from 'msw'
import type { z } from 'zod'

import type { AnyEndpoint, EndpointParsedInput } from '@/lib/api'
import { env } from '@/lib/env'
import type { ApiErrorBody, HttpMethod } from '@/types'

/** Throw inside a mock resolver to answer with an HTTP error. */
export class MockHttpError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail)
    this.status = status
    this.body = body
  }
}

const METHOD_HANDLERS = {
  GET: http.get,
  POST: http.post,
  PUT: http.put,
  PATCH: http.patch,
  DELETE: http.delete,
} as const satisfies Record<HttpMethod, unknown>

export interface MockOptions {
  /** Overrides `VITE_MOCK_DELAY_MS` for this endpoint. */
  delayMs?: number
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    ;(out[key] ??= []).push(issue.message)
  }
  return out
}

/**
 * An MSW handler for an endpoint definition. It parses the query/body with the endpoint's own
 * schemas (400 on failure, like DRF) and checks the mock's answer against the response schema, so
 * mocks can never drift from the contract the real API must meet.
 */
export function mockEndpoint<E extends AnyEndpoint>(
  endpoint: E,
  resolve: (
    input: EndpointParsedInput<E>,
    request: Request,
  ) => z.input<E['response']> | Promise<z.input<E['response']>>,
  options: MockOptions = {},
): HttpHandler {
  const url = `${env.VITE_API_BASE_URL.replace(/\/$/, '')}${endpoint.path}`

  return METHOD_HANDLERS[endpoint.method](url, async ({ request }) => {
    await delay(options.delayMs ?? env.VITE_MOCK_DELAY_MS)

    let query: unknown
    if (endpoint.query) {
      const raw = Object.fromEntries(new URL(request.url).searchParams)
      const parsed = endpoint.query.safeParse(raw)
      if (!parsed.success) {
        return HttpResponse.json<ApiErrorBody>(
          {
            detail: 'Invalid query parameters.',
            code: 'invalid',
            fieldErrors: fieldErrors(parsed.error),
          },
          { status: 400 },
        )
      }
      query = parsed.data
    }

    let body: unknown
    if (endpoint.body) {
      const parsed = endpoint.body.safeParse(await request.json().catch(() => undefined))
      if (!parsed.success) {
        return HttpResponse.json<ApiErrorBody>(
          {
            detail: 'Invalid request body.',
            code: 'invalid',
            fieldErrors: fieldErrors(parsed.error),
          },
          { status: 400 },
        )
      }
      body = parsed.data
    }

    try {
      const result = await resolve({ query, body } as EndpointParsedInput<E>, request)
      const checked = endpoint.response.safeParse(result)
      if (!checked.success) {
        console.error(
          `[mock] ${endpoint.method} ${endpoint.path} returned data that breaks the contract`,
          checked.error.issues,
        )
        return HttpResponse.json<ApiErrorBody>(
          { detail: 'Mock response failed validation.', code: 'mock_contract' },
          { status: 500 },
        )
      }
      return HttpResponse.json(result as never)
    } catch (error) {
      if (error instanceof MockHttpError)
        return HttpResponse.json(error.body, { status: error.status })
      throw error
    }
  })
}
