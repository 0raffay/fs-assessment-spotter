/**
 * Every page URL in the app, defined once.
 *
 * - Links and navigation call a builder: `navigate(ROUTES.routePlanner({ from: 'Dallas' }))`.
 * - The router registers the same builders with no arguments to get the path pattern.
 *   Path params default to their `:param` placeholder for this reason:
 *   `ROUTES.trip()` → `/trips/:tripId`, `ROUTES.trip('42')` → `/trips/42`.
 */

type SearchParams = Record<string, string | number | boolean | null | undefined>

/** Appends search params to a path, skipping empty values. */
export function withSearch(path: string, params?: SearchParams): string {
  if (!params) return path
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

export const ROUTES = {
  routePlanner: (params?: { from?: string; to?: string }) => withSearch('/', params),
} as const

export type RouteName = keyof typeof ROUTES
