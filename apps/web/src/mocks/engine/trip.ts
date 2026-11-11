/**
 * MOCK ONLY: builds a full `TripPlan` for any request, the way the backend will: three route
 * variants, checkpoints every N miles, weather at each checkpoint's ETA, risk via the PDF rules and
 * ranking by the PDF's order. Delete with the mocks once Django serves /routes/plan/.
 */
import { addHours } from '@/lib/format'
import { riskIndex } from '@/lib/risk'
import {
  type Checkpoint,
  type LngLat,
  type ReasonFact,
  type RiskLevel,
  type Route,
  type TripPlan,
  type TripRequest,
} from '@/types'

import { buildCurvedPath, cumulativeMiles, haversineMiles, paddedBBox, pointAtMile } from './geo'
import { nearestPlace } from './places'
import { classify } from './rules'
import { weatherAt, weatherModelFor } from './weather'

const FORECAST_HORIZON_HOURS = 16 * 24
const ROAD_FACTOR = 1.18

interface Variant {
  key: string
  bend: number
  wobble: number
  mph: number
}

const VARIANTS: readonly Variant[] = [
  { key: 'a', bend: 0, wobble: 0.6, mph: 61 },
  { key: 'b', bend: 0.2, wobble: 1, mph: 59 },
  { key: 'c', bend: -0.17, wobble: 0.8, mph: 57 },
]

export function floorToHour(date: Date): Date {
  const copy = new Date(date)
  copy.setUTCMinutes(0, 0, 0)
  return copy
}

function emptyRiskRecord(): Record<RiskLevel, number> {
  return { low: 0, moderate: 0, high: 0, severe: 0, no_travel: 0 }
}

function sideName(from: LngLat, to: LngLat, bend: number): string {
  if (bend === 0) return 'Direct route'
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  // Offset direction of the bow: (-dy, dx) * bend.
  const ox = -dy * bend
  const oy = dx * bend
  if (Math.abs(oy) >= Math.abs(ox)) return oy > 0 ? 'Northern route' : 'Southern route'
  return ox > 0 ? 'Eastern route' : 'Western route'
}

function buildRoute(
  request: TripRequest,
  variant: Variant,
  issuedAt: Date,
  planId: string,
  model: ReturnType<typeof weatherModelFor>,
  path: LngLat[],
): Route {
  const cumulative = cumulativeMiles(path)
  const pathMiles = cumulative[cumulative.length - 1] ?? 0
  const distanceMiles = Math.round(pathMiles * ROAD_FACTOR)
  const scale = distanceMiles / (pathMiles || 1)
  const durationMinutes = Math.round((distanceMiles / variant.mph) * 60)
  const departure = new Date(request.departureAt)
  const interval = request.intervalMiles

  const checkpoints: Checkpoint[] = []
  for (let mile = 0, index = 0; mile < distanceMiles; mile += interval, index++) {
    const coordinates = pointAtMile(path, cumulative, mile / scale)
    const eta = addHours(departure, mile / variant.mph)
    const hoursFromIssue = Math.max(0, (eta.getTime() - issuedAt.getTime()) / 3_600_000)
    const place = nearestPlace(coordinates)
    const near = haversineMiles(coordinates, place.coordinates) < 12 ? '' : 'near '
    const base = {
      id: `${planId}-${variant.key}-${index}` as Checkpoint['id'],
      index,
      mile,
      segmentMiles: Math.min(interval, distanceMiles - mile),
      coordinates,
      locationLabel: `${near}${place.name}, ${place.region}`,
      eta: eta.toISOString(),
      timeZone: place.timeZone,
    }
    if (hoursFromIssue > FORECAST_HORIZON_HOURS) {
      checkpoints.push({ ...base, forecast: { status: 'unavailable' } })
      continue
    }
    const forecastHour = addHours(issuedAt, Math.round(hoursFromIssue))
    const weather = weatherAt(model, coordinates, Math.round(hoursFromIssue))
    const result = classify(weather, request.loadWeightLb)
    checkpoints.push({
      ...base,
      forecast: {
        status: 'available',
        forecastHour: forecastHour.toISOString(),
        weather,
        ...result,
      },
    })
  }

  const riskMiles = emptyRiskRecord()
  let scoreSum = 0
  let scored = 0
  for (const checkpoint of checkpoints) {
    if (checkpoint.forecast.status !== 'available') continue
    riskMiles[checkpoint.forecast.level] += checkpoint.segmentMiles
    scoreSum += riskIndex(checkpoint.forecast.level)
    scored++
  }

  const third = nearestPlace(pointAtMile(path, cumulative, pathMiles * 0.35), [
    request.origin.id,
    request.destination.id,
  ])
  const twoThirds = nearestPlace(pointAtMile(path, cumulative, pathMiles * 0.68), [
    request.origin.id,
    request.destination.id,
    third.id,
  ])

  return {
    id: `${planId}-${variant.key}` as Route['id'],
    rank: 0,
    name: sideName(request.origin.coordinates, request.destination.coordinates, variant.bend),
    via: `via ${third.name}, ${twoThirds.name}`,
    distanceMiles,
    durationMinutes,
    departureAt: departure.toISOString(),
    arrivalAt: addHours(departure, durationMinutes / 60).toISOString(),
    geometry: path,
    checkpoints,
    riskMiles,
    averageRisk: scored ? Math.round((scoreSum / scored) * 100) / 100 : 0,
    isRecommended: false,
    isFastest: false,
    isGenerated: false,
  }
}

/** The PDF's order: fewest No Travel, Severe, High miles; lowest average risk; shortest time. */
export function compareRoutes(a: Route, b: Route): number {
  for (const level of ['no_travel', 'severe', 'high'] as const) {
    const diff = a.riskMiles[level] - b.riskMiles[level]
    if (diff !== 0) return diff
  }
  return a.averageRisk - b.averageRisk || a.durationMinutes - b.durationMinutes
}

function reasonsFor(winner: Route, others: readonly Route[]): ReasonFact[] {
  const reasons: ReasonFact[] = []
  const decisive = (['no_travel', 'severe', 'high'] as const).find((level) =>
    others.some((o) => o.riskMiles[level] !== winner.riskMiles[level]),
  )
  if (decisive) {
    reasons.push({
      kind: 'fewest_miles',
      level: decisive,
      miles: winner.riskMiles[decisive],
      othersMiles: others.map((o) => o.riskMiles[decisive]),
    })
  } else if (others.some((o) => o.averageRisk !== winner.averageRisk)) {
    reasons.push({
      kind: 'lowest_average_risk',
      value: winner.averageRisk,
      othersValues: others.map((o) => o.averageRisk),
    })
  } else {
    reasons.push({ kind: 'shortest_time', minutes: winner.durationMinutes })
  }
  const fastest = Math.min(winner.durationMinutes, ...others.map((o) => o.durationMinutes))
  if (winner.durationMinutes > fastest)
    reasons.push({ kind: 'time_vs_fastest', deltaMinutes: winner.durationMinutes - fastest })
  return reasons
}

export function buildTripPlan(request: TripRequest, now: Date = new Date()): TripPlan {
  const issuedAt = floorToHour(now)
  const planId =
    `plan-${request.origin.id}-${request.destination.id}-${request.loadWeightLb}-${request.intervalMiles}-${new Date(request.departureAt).getTime()}`
      .replace(/[^a-z0-9-]+/gi, '-')
      .toLowerCase()
  const paths = VARIANTS.map((variant) =>
    buildCurvedPath(
      request.origin.coordinates,
      request.destination.coordinates,
      variant.bend,
      variant.wobble,
    ),
  )
  const bbox = paddedBBox(paths)
  const model = weatherModelFor(bbox)
  const built = VARIANTS.map((variant, i) =>
    buildRoute(request, variant, issuedAt, planId, model, paths[i] ?? []),
  )

  const ranked = [...built].sort(compareRoutes)
  const fastestMinutes = Math.min(...ranked.map((route) => route.durationMinutes))
  const routes = ranked.map((route, i) => ({
    ...route,
    rank: i + 1,
    isRecommended: i === 0,
    isFastest: route.durationMinutes === fastestMinutes,
  }))
  const [winner, ...others] = routes
  if (!winner) throw new Error('No routes built')

  return {
    id: planId as TripPlan['id'],
    request,
    routes,
    recommendedRouteId: winner.id,
    reasons: reasonsFor(winner, others),
    bbox,
    forecastIssuedAt: issuedAt.toISOString(),
    generatedAt: now.toISOString(),
  }
}
