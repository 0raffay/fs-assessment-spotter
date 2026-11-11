import type { BBox, LngLat } from '@/types'

const EARTH_RADIUS_MILES = 3958.8
const toRad = (deg: number) => (deg * Math.PI) / 180

export function haversineMiles([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a))
}

/**
 * A smooth path from `from` to `to`, bowed sideways by `bend` (fraction of the trip length; sign
 * picks the side) with a little wobble so it reads like a road rather than a geodesic.
 */
export function buildCurvedPath(
  from: LngLat,
  to: LngLat,
  bend: number,
  wobble: number,
  samples = 140,
): LngLat[] {
  const [x0, y0] = from
  const [x1, y1] = to
  const dx = x1 - x0
  const dy = y1 - y0
  const cx = (x0 + x1) / 2 - dy * bend
  const cy = (y0 + y1) / 2 + dx * bend
  const length = Math.hypot(dx, dy)
  const path: LngLat[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const u = 1 - t
    let x = u * u * x0 + 2 * u * t * cx + t * t * x1
    let y = u * u * y0 + 2 * u * t * cy + t * t * y1
    const w = Math.sin(t * Math.PI * 5 + bend * 7) * Math.sin(t * Math.PI) * wobble * length * 0.02
    x += (-dy / (length || 1)) * w
    y += (dx / (length || 1)) * w
    path.push([x, y])
  }
  return path
}

/** Distance from the start, in miles, at each vertex. */
export function cumulativeMiles(path: readonly LngLat[]): number[] {
  const out = [0]
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1]
    const cur = path[i]
    if (!prev || !cur) continue
    out.push((out[i - 1] ?? 0) + haversineMiles(prev, cur))
  }
  return out
}

/** The point `mile` miles along the path (linear between vertices). */
export function pointAtMile(
  path: readonly LngLat[],
  cumulative: readonly number[],
  mile: number,
): LngLat {
  for (let i = 1; i < path.length; i++) {
    const end = cumulative[i] ?? 0
    if (end >= mile) {
      const start = cumulative[i - 1] ?? 0
      const a = path[i - 1]
      const b = path[i]
      if (!a || !b) break
      const t = end === start ? 0 : (mile - start) / (end - start)
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
  }
  const last = path[path.length - 1]
  if (!last) throw new Error('Empty path')
  return last
}

/** Bounding box of several paths, padded and snapped to a 0.5° grid. */
export function paddedBBox(paths: readonly (readonly LngLat[])[], paddingDeg = 1): BBox {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const path of paths) {
    for (const [lng, lat] of path) {
      west = Math.min(west, lng)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      north = Math.max(north, lat)
    }
  }
  const snapDown = (v: number) => Math.floor(v * 2) / 2
  const snapUp = (v: number) => Math.ceil(v * 2) / 2
  return [
    snapDown(west - paddingDeg),
    snapDown(south - paddingDeg),
    snapUp(east + paddingDeg),
    snapUp(north + paddingDeg),
  ]
}

/** Small deterministic PRNG so mock data is stable for the same input. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let state = h >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
