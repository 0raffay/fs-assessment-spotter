import type { ReactNode } from 'react'

import type { HeatmapMeasure } from '@/features/forecast'
import type { Basemap, MapLayerVisibility } from '@/features/map'

/**
 * Side panels the rail opens, one at a time, beside the rail. The forecast and the risk profile live
 * in the bottom dock and toggle on their own.
 */
export const MAP_PANELS = ['layers', 'legend', 'checkpoints'] as const
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
  /** The risk profile in the bottom dock (desktop only). */
  isProfileOpen: boolean
  setProfileOpen: (open: boolean) => void
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
