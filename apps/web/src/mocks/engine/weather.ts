/** MOCK ONLY: deterministic, storm-shaped weather so the UI has interesting data to show. */
import type { BBox, LngLat, WeatherCondition, WeatherReading } from '@/types'

import { haversineMiles, seededRandom } from './geo'

interface Storm {
  kind: WeatherCondition
  /** Center at hour 0, as fractions of the bbox (x: west→east, y: south→north). */
  origin: LngLat
  /** Movement in degrees per hour. */
  velocity: LngLat
  radiusMiles: number
  peak: number
  peakHour: number
  spreadHours: number
}

export interface WeatherModel {
  storms: readonly Storm[]
  seedNoise: number
}

/** Storm layout is derived from the bbox only, so the plan and the heatmap agree. */
export function weatherModelFor(bbox: BBox): WeatherModel {
  const [west, south, east, north] = bbox
  const random = seededRandom(bbox.join(','))
  const at = (fx: number, fy: number): LngLat => [
    west + (east - west) * fx,
    south + (north - south) * fy,
  ]
  const jitter = (v: number) => v + (random() - 0.5) * 0.12
  // Peaks sit 8–36h out, where most trips planned "for tomorrow" are on the road.
  const storms: Storm[] = [
    {
      kind: 'wind',
      origin: at(jitter(0.5), jitter(0.48)),
      velocity: [0.1, 0.03],
      radiusMiles: 170,
      peak: 47,
      peakHour: 22,
      spreadHours: 14,
    },
    {
      kind: 'wind',
      origin: at(jitter(0.3), jitter(0.3)),
      velocity: [0.08, 0.05],
      radiusMiles: 120,
      peak: 34,
      peakHour: 32,
      spreadHours: 12,
    },
    {
      kind: 'rain',
      origin: at(jitter(0.72), jitter(0.62)),
      velocity: [0.04, 0.03],
      radiusMiles: 140,
      peak: 0.6,
      peakHour: 18,
      spreadHours: 12,
    },
    {
      kind: 'snow',
      origin: at(jitter(0.2), jitter(0.7)),
      velocity: [0.03, -0.02],
      radiusMiles: 110,
      peak: 2.8,
      peakHour: 26,
      spreadHours: 14,
    },
  ]
  return { storms, seedNoise: random() }
}

const gaussian = (x: number) => Math.exp(-x * x)

export function weatherAt(
  model: WeatherModel,
  coordinates: LngLat,
  hoursFromIssue: number,
): WeatherReading {
  const [lng, lat] = coordinates
  const ripple = Math.sin(lng * 1.7 + lat * 2.3 + model.seedNoise * 10 + hoursFromIssue * 0.3)
  const reading = { wind: 9 + 5 * (ripple + 1), rain: 0, snow: 0 }
  for (const storm of model.storms) {
    const center: LngLat = [
      storm.origin[0] + storm.velocity[0] * hoursFromIssue,
      storm.origin[1] + storm.velocity[1] * hoursFromIssue,
    ]
    const space = gaussian(haversineMiles(coordinates, center) / storm.radiusMiles)
    const time = gaussian((hoursFromIssue - storm.peakHour) / storm.spreadHours)
    const amount = storm.peak * space * time
    if (storm.kind === 'snow' && lat < 35) continue
    reading[storm.kind] += amount
  }
  return {
    wind: Math.round(reading.wind * 10) / 10,
    rain: Math.max(0, Math.round((reading.rain - 0.02) * 100) / 100),
    snow: Math.max(0, Math.round((reading.snow - 0.05) * 100) / 100),
  }
}
