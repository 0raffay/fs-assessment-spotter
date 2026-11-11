import type { FeatureCollection, Polygon } from 'geojson'
import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import { useCssVariables } from '@/hooks/use-css-variables'
import { RISK_LEVELS } from '@/types'

import type { Heatmap, HeatmapMeasure } from '../types'

/** Base opacity per risk index (DESIGN.md › heatmap-layer): calm areas stay quiet. */
const OPACITY = [0.06, 0.2, 0.28, 0.36, 0.42] as const
const PREFIX: Record<HeatmapMeasure, string> = { risk: 'r', wind: 'w', rain: 'p', snow: 's' }

/**
 * Builds the GeoJSON once. Hourly levels are flattened into numeric properties (`r0`…`r48`) because
 * MapLibre serializes nested arrays in properties, so `['get', 'r14']` is how a frame is read.
 */
function toGeoJson(heatmap: Heatmap): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: heatmap.cells.map((cell) => {
      const [w, s, e, n] = cell.bounds
      const properties: Record<string, number> = {}
      for (const measure of Object.keys(PREFIX) as HeatmapMeasure[]) {
        cell.levels[measure].forEach(
          (level, hour) => (properties[`${PREFIX[measure]}${hour}`] = level),
        )
      }
      return {
        type: 'Feature',
        id: cell.id,
        properties,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [w, s],
              [e, s],
              [e, n],
              [w, n],
              [w, s],
            ],
          ],
        },
      }
    }),
  }
}

interface HeatmapLayerProps {
  heatmap: Heatmap
  hour: number
  measure?: HeatmapMeasure
  /** 0–1 multiplier on the per-level opacity. */
  opacity?: number
  visible?: boolean
  /** Draw beneath this layer (the routes). */
  beforeId?: string
}

/**
 * The corridor grid in risk colors for one forecast hour. Moving the slider only swaps the paint
 * expression's property name, so frames change without rebuilding data or re-rendering the map.
 */
export function HeatmapLayer({
  heatmap,
  hour,
  measure = 'risk',
  opacity = 1,
  visible = true,
  beforeId,
}: HeatmapLayerProps) {
  const data = useMemo(() => toGeoJson(heatmap), [heatmap])
  const colors = useCssVariables([
    '--risk-low',
    '--risk-moderate',
    '--risk-high',
    '--risk-severe',
    '--risk-no-travel',
  ])
  const key = `${PREFIX[measure]}${Math.min(hour, heatmap.hours)}`
  const palette = [
    colors['--risk-low'],
    colors['--risk-moderate'],
    colors['--risk-high'],
    colors['--risk-severe'],
    colors['--risk-no-travel'],
  ]

  return (
    <Source id="forecast-heatmap" type="geojson" data={data}>
      <Layer
        id="forecast-heatmap-fill"
        type="fill"
        beforeId={beforeId}
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          'fill-color': [
            'match',
            ['get', key],
            ...RISK_LEVELS.flatMap((_, i) => [i, palette[i] ?? palette[0]!]),
            palette[0]!,
          ] as never,
          'fill-opacity': [
            'match',
            ['get', key],
            ...OPACITY.flatMap((value, i) => [i, value * opacity]),
            0,
          ] as never,
          'fill-outline-color': 'rgba(0,0,0,0)',
        }}
      />
    </Source>
  )
}
