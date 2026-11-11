/** MOCK ONLY: the hourly corridor grid, from the same storms as the trip plan. */
import type { Heatmap, HeatmapMeasure } from '@/features/forecast/types'
import { riskIndex } from '@/lib/risk'
import type { BBox, RiskIndex } from '@/types'

import { classify } from './rules'
import { floorToHour } from './trip'
import { weatherAt, weatherModelFor } from './weather'

const CELL = 0.5

export interface HeatmapRequest {
  bbox: BBox
  hours: number
  loadWeightLb: number
}

export function buildHeatmap(
  { bbox, hours, loadWeightLb }: HeatmapRequest,
  now: Date = new Date(),
): Heatmap {
  const startsAt = floorToHour(now)
  const model = weatherModelFor(bbox)
  const [west, south, east, north] = bbox
  const worst: RiskIndex[] = Array.from({ length: hours + 1 }, () => 0)
  const cells: Heatmap['cells'] = []

  for (let lng = west; lng < east - 1e-9; lng += CELL) {
    for (let lat = south; lat < north - 1e-9; lat += CELL) {
      const center: [number, number] = [lng + CELL / 2, lat + CELL / 2]
      const levels: Record<HeatmapMeasure, RiskIndex[]> = { risk: [], wind: [], rain: [], snow: [] }
      for (let hour = 0; hour <= hours; hour++) {
        const result = classify(weatherAt(model, center, hour), loadWeightLb)
        const overall = riskIndex(result.level)
        levels.risk.push(overall)
        levels.wind.push(riskIndex(result.conditionLevels.wind))
        levels.rain.push(riskIndex(result.conditionLevels.rain))
        levels.snow.push(riskIndex(result.conditionLevels.snow))
        if (overall > (worst[hour] ?? 0)) worst[hour] = overall
      }
      cells.push({
        id: `${lng.toFixed(1)},${lat.toFixed(1)}`,
        bounds: [lng, lat, lng + CELL, lat + CELL],
        levels,
      })
    }
  }

  return {
    bbox,
    cellSizeDegrees: CELL,
    startsAt: startsAt.toISOString(),
    hours,
    cells,
    worstByHour: worst,
  }
}
