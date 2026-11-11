import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'

import { FloatingPanel } from '@/components/floating-panel'
import type { MapPadding } from '@/features/map'
import { cn } from '@/lib/utils'

import { useMapTools } from '../context/map-tools-store'
import type { MapPanel } from '../types'

import { LayersPanel } from './layers-panel'
import { LegendPanel } from './legend-panel'
import { MapToolRail } from './map-tool-rail'

interface MapToolsOverlayProps {
  compact: boolean
  fitPadding: MapPadding
  /** Panels owned by other features (checkpoint list, risk profile), keyed by panel id. */
  extraPanels?: Partial<Record<MapPanel, ReactNode>>
}

const PANEL_TITLES: Record<MapPanel, string> = {
  layers: 'Map layers',
  legend: 'Legend',
  checkpoints: 'Checkpoints',
  profile: 'Risk profile',
}

/** The rail at the top right and whichever panel it has open, beside it. */
export function MapToolsOverlay({ compact, fitPadding, extraPanels = {} }: MapToolsOverlayProps) {
  const { activePanel } = useMapTools()
  const panels: Partial<Record<MapPanel, ReactNode>> = {
    layers: <LayersPanel />,
    legend: <LegendPanel />,
    ...extraPanels,
  }
  const content = activePanel ? panels[activePanel] : null

  return (
    <>
      <div className={cn('absolute z-30', compact ? 'top-3 right-3' : 'top-4 right-4')}>
        <MapToolRail compact={compact} fitPadding={fitPadding} />
      </div>
      <AnimatePresence mode="wait">
        {activePanel && content && activePanel !== 'profile' ? (
          <FloatingPanel
            key={activePanel}
            from="right"
            aria-label={PANEL_TITLES[activePanel]}
            className={cn(
              'absolute z-30 overflow-y-auto',
              compact
                ? 'top-3 right-[68px] max-h-[calc(100%-24px)] w-[min(296px,calc(100%-80px))]'
                : 'top-4 right-[76px] max-h-[calc(100%-32px)] w-[300px]',
            )}
          >
            {content}
          </FloatingPanel>
        ) : null}
      </AnimatePresence>
    </>
  )
}
