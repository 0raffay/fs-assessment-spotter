import type { Theme } from '@/lib/theme'

import type { Basemap } from '../types'

/** CARTO vector styles: free with attribution, no key (see docs). */
const STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  terrain: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
} as const satisfies Record<Exclude<Basemap, 'auto'>, string>

export function basemapStyleUrl(basemap: Basemap, theme: Theme): string {
  return STYLES[basemap === 'auto' ? theme : basemap]
}
