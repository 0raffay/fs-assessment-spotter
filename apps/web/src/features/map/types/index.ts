import type { ReactNode } from 'react'

export const BASEMAPS = ['auto', 'dark', 'light', 'terrain'] as const
/** `auto` follows the app theme. */
export type Basemap = (typeof BASEMAPS)[number]

/** Space (px) kept clear on each side when fitting routes, so panels never hide them. */
export interface MapPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface MapLayerVisibility {
  alternateRoutes: boolean
  checkpoints: boolean
  routeNumbers: boolean
  placeLabels: boolean
}

export const DEFAULT_LAYER_VISIBILITY: MapLayerVisibility = {
  alternateRoutes: true,
  checkpoints: true,
  routeNumbers: true,
  placeLabels: true,
}

export type MapStatus = 'idle' | 'loading' | 'ready'

export interface TripMapProps {
  padding: MapPadding
  /** Drives the empty/loading hint over the map. */
  status: MapStatus
  basemap?: Basemap
  layers?: MapLayerVisibility
  /** Where the checkpoint card goes: a popup by the marker (desktop) or docked at the top. */
  cardPlacement: 'popup' | 'docked'
  /** Extra sources/layers (e.g. the forecast heatmap), rendered inside the map. */
  children?: ReactNode
}
