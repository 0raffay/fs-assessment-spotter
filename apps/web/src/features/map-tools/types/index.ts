import type { ReactNode } from 'react'

import type { HeatmapMeasure } from '@/features/forecast'
import type { Basemap, MapLayerVisibility } from '@/features/map'

/** Panels the rail can open. `forecast` lives in the forecast feature; the rest are owned here. */
export const MAP_PANELS = ['layers', 'legend', 'checkpoints', 'profile'] as const
export type MapPanel = (typeof MAP_PANELS)[number]

export interface HeatmapSettings {
  visible: boolean
  measure: HeatmapMeasure
  /** Multiplier on the per-level opacity, 0.2–1.5 (the panel slider is 20–150%). */
  opacity: number
}

export interface MapToolsState {
  activePanel: MapPanel | null
  togglePanel: (panel: MapPanel) => void
  closePanel: () => void
  basemap: Basemap
  setBasemap: (basemap: Basemap) => void
  layers: MapLayerVisibility
  setLayer: <K extends keyof MapLayerVisibility>(key: K, value: MapLayerVisibility[K]) => void
  heatmap: HeatmapSettings
  setHeatmap: <K extends keyof HeatmapSettings>(key: K, value: HeatmapSettings[K]) => void
}

/** One rail button: a typed id plus how to render and act on it. */
export interface ToolDefinition<TId extends string> {
  id: TId
  label: string
  icon: ReactNode
  pressed?: boolean
  disabled?: boolean
  onSelect: () => void
  /** Draw a divider before this button. */
  separated?: boolean
}
