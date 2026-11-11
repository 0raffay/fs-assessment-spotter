import type { MapPadding } from '../types'

/** The smallest clear area (px) the map keeps between opposite paddings. */
export const MIN_CLEAR = 160

/**
 * Shrinks opposite paddings proportionally when together they'd leave less than `minClear` px of
 * map, so fits and eases never zoom out to the whole continent on a narrow window.
 */
export function clampPadding(
  padding: MapPadding,
  width: number,
  height: number,
  minClear = MIN_CLEAR,
): MapPadding {
  const scale = (a: number, b: number, size: number): [number, number] => {
    const budget = Math.max(size - minClear, 0)
    const total = a + b
    if (total <= budget || total === 0) return [a, b]
    const ratio = budget / total
    return [Math.floor(a * ratio), Math.floor(b * ratio)]
  }
  const [left, right] = scale(padding.left, padding.right, width)
  const [top, bottom] = scale(padding.top, padding.bottom, height)
  return { top, right, bottom, left }
}
