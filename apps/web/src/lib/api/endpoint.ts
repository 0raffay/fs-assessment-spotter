import type { z } from 'zod'

import type { HttpMethod, Prettify } from '@/types'

import { api, ApiError } from './client'

/**
 * One API endpoint, described once and shared by the service (to call it), the mock handler (to
 * answer it) and the tests. Query, body and response are zod schemas, so every request and response
 * is typed AND validated at runtime.
 */
export interface EndpointDefinition<
  TMethod extends HttpMethod = HttpMethod,
  TQuery extends z.ZodType | undefined = z.ZodType | undefined,
  TBody extends z.ZodType | undefined = z.ZodType | undefined,
  TResponse extends z.ZodType = z.ZodType,
> {
  readonly method: TMethod
  /** Path relative to the API base URL, with a trailing slash (Django style). */
  readonly path: `/${string}/`
  readonly query?: TQuery
  readonly body?: TBody
  readonly response: TResponse
}

export type AnyEndpoint = EndpointDefinition<
  HttpMethod,
  z.ZodType | undefined,
  z.ZodType | undefined,
  z.ZodType
>

/** Keeps the literal types of a definition, so inference stays precise. */
export function defineEndpoint<const TEndpoint extends AnyEndpoint>(
  endpoint: TEndpoint,
): TEndpoint {
  return endpoint
}

type QueryPart<E extends AnyEndpoint> = E['query'] extends z.ZodType
  ? { query: z.input<E['query']> }
  : { query?: never }
type BodyPart<E extends AnyEndpoint> = E['body'] extends z.ZodType
  ? { body: z.input<E['body']> }
  : { body?: never }

/** What a caller passes: `query` and/or `body` exactly when the endpoint declares them. */
export type EndpointRequest<E extends AnyEndpoint> = Prettify<
  QueryPart<E> & BodyPart<E> & { signal?: AbortSignal }
>

/** The validated, parsed response type. */
export type EndpointResponse<E extends AnyEndpoint> = z.output<E['response']>

/** Parsed query and body, as a mock handler receives them. */
export type EndpointParsedInput<E extends AnyEndpoint> = {
  query: E['query'] extends z.ZodType ? z.output<E['query']> : undefined
  body: E['body'] extends z.ZodType ? z.output<E['body']> : undefined
}

function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
  kind: 'invalid_request' | 'invalid_response',
  label: string,
): z.output<TSchema> {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ApiError(
      kind,
      `${label}: ${result.error.issues.map((issue) => issue.message).join('; ')}`,
    )
  }
  return result.data
}

/** Calls an endpoint through the shared agent, validating input and output. */
export async function callEndpoint<E extends AnyEndpoint>(
  endpoint: E,
  request: EndpointRequest<E>,
): Promise<EndpointResponse<E>> {
  const label = `${endpoint.method} ${endpoint.path}`
  const params = endpoint.query
    ? parseOrThrow(endpoint.query, request.query, 'invalid_request', label)
    : undefined
  const data = endpoint.body
    ? parseOrThrow(endpoint.body, request.body, 'invalid_request', label)
    : undefined

  const response = await api.request<unknown>({
    method: endpoint.method,
    url: endpoint.path,
    params,
    data,
    signal: request.signal,
  })
  return parseOrThrow(
    endpoint.response,
    response.data,
    'invalid_response',
    label,
  ) as EndpointResponse<E>
}
