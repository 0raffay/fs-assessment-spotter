import { z } from 'zod'

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
export type HttpMethod = (typeof HTTP_METHODS)[number]

/** Error body every API endpoint returns on failure (DRF-style). */
export const apiErrorBodySchema = z.object({
  detail: z.string(),
  code: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

/** What kind of failure an `ApiError` represents, so the UI can pick a message without status math. */
export type ApiErrorKind =
  'network' | 'timeout' | 'http' | 'invalid_response' | 'invalid_request' | 'unknown'
