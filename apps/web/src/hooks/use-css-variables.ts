import { useMemo } from 'react'

import { useTheme } from '@/lib/theme'

/**
 * Reads design-token CSS variables as concrete colors for canvas/WebGL drawing (MapLibre can't use
 * `var(--x)`). Re-reads when the theme changes. Keys keep their literal types.
 */
export function useCssVariables<const TName extends `--${string}`>(
  names: readonly TName[],
): Readonly<Record<TName, string>> {
  const { theme } = useTheme()
  const key = names.join('|')

  return useMemo(() => {
    const style = typeof window === 'undefined' ? null : getComputedStyle(document.documentElement)
    return Object.fromEntries(
      names.map((name) => [name, style?.getPropertyValue(name).trim() || '#888888']),
    ) as Record<TName, string>
    // `key` stands in for `names` so callers can pass inline arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, key])
}
