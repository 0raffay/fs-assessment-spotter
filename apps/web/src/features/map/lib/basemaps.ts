import type { StyleSpecification } from 'maplibre-gl'

import type { Theme } from '@/lib/theme'

import type { Basemap } from '../types'

/** CARTO vector styles: free with attribution, no key (see docs). */
const VECTOR_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  terrain: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
} as const

const USGS = 'https://basemap.nationalmap.gov/arcgis/rest/services'

/** USGS National Map orthoimagery: public domain, no key, US coverage, detail to zoom 16. */
export const USGS_IMAGERY_TILES = `${USGS}/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}`
/** The same imagery with US Topo roads, place names and boundaries drawn in ("hybrid"). */
export const USGS_HYBRID_TILES = `${USGS}/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}`

/** The labelled (hybrid) imagery layer; "Place labels" hides it to show plain imagery. */
export const SATELLITE_LABELS_LAYER = 'satellite-hybrid'
/** The plain imagery layer, shown only while the labelled one is hidden (no double fetching). */
export const SATELLITE_IMAGERY_LAYER = 'satellite-imagery'

const USGS_RASTER = { type: 'raster', tileSize: 256, maxzoom: 16 } as const
// Slightly muted so the route and risk colors stay the loudest thing on the map.
const IMAGERY_PAINT = { 'raster-saturation': -0.2, 'raster-brightness-max': 0.88 } as const

/**
 * USGS imagery for the satellite view. CARTO's labels-only rasters can't be used here: from a
 * browser they come back stamped "API KEY REQUIRED".
 */
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      ...USGS_RASTER,
      tiles: [USGS_IMAGERY_TILES],
      attribution: 'Imagery: USDA, USGS The National Map',
    },
    hybrid: {
      ...USGS_RASTER,
      tiles: [USGS_HYBRID_TILES],
      attribution: 'USGS The National Map: Orthoimagery and US Topo',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#0b0d12' } },
    {
      id: SATELLITE_IMAGERY_LAYER,
      type: 'raster',
      source: 'imagery',
      layout: { visibility: 'none' },
      paint: IMAGERY_PAINT,
    },
    { id: SATELLITE_LABELS_LAYER, type: 'raster', source: 'hybrid', paint: IMAGERY_PAINT },
  ],
}

/** The MapLibre style for a basemap: a CARTO style URL, or the satellite style object. */
export function basemapStyle(basemap: Basemap, theme: Theme): string | StyleSpecification {
  if (basemap === 'satellite') return SATELLITE_STYLE
  return VECTOR_STYLES[basemap === 'auto' ? theme : basemap]
}
