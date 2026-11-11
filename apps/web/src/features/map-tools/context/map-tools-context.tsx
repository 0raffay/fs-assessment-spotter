import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { DEFAULT_LAYER_VISIBILITY, type Basemap, type MapLayerVisibility } from '@/features/map'

import type { HeatmapSettings, MapPanel, MapToolsState } from '../types'

import { MapToolsContextProvider } from './map-tools-store'

const DEFAULT_HEATMAP: HeatmapSettings = { visible: true, measure: 'risk', opacity: 1 }

/** Which rail panel is open, plus the map's layer and basemap settings. */
export function MapToolsProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<MapPanel | null>(null)
  const [basemap, setBasemap] = useState<Basemap>('auto')
  const [layers, setLayers] = useState<MapLayerVisibility>(DEFAULT_LAYER_VISIBILITY)
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [heatmap, setHeatmapState] = useState<HeatmapSettings>(DEFAULT_HEATMAP)

  // Escape closes the open panel.
  useEffect(() => {
    if (!activePanel) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setActivePanel(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePanel])

  const value = useMemo<MapToolsState>(
    () => ({
      activePanel,
      togglePanel: (panel) => setActivePanel((current) => (current === panel ? null : panel)),
      closePanel: () => setActivePanel(null),
      isProfileOpen,
      setProfileOpen,
      basemap,
      setBasemap,
      layers,
      setLayer: (key, next) => setLayers((current) => ({ ...current, [key]: next })),
      heatmap,
      setHeatmap: (key, next) => setHeatmapState((current) => ({ ...current, [key]: next })),
    }),
    [activePanel, isProfileOpen, basemap, layers, heatmap],
  )

  return <MapToolsContextProvider value={value}>{children}</MapToolsContextProvider>
}
