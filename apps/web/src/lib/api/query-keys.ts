/**
 * Builds a typed query-key namespace for a feature:
 *
 *   const keys = createQueryKeys('routes')
 *   keys.all            // readonly ['routes']
 *   keys.of('plan', x)  // readonly ['routes', 'plan', typeof x]
 *
 * Invalidating `keys.all` clears every query of that feature.
 */
export function createQueryKeys<const TScope extends string>(scope: TScope) {
  return {
    all: [scope] as const,
    of: <const TParts extends readonly unknown[]>(...parts: TParts) => [scope, ...parts] as const,
  }
}
