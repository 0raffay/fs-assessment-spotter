import { describe, expect, it } from 'vitest'

import { fixturePlan } from '@/tests/fixtures'

import { basemapStyle, SATELLITE_LABELS_LAYER } from '../basemaps'
import { lineMidpoint, routesBounds, routesToFeatureCollection } from '../geojson'

describe('map geojson helpers', () => {
  const plan = fixturePlan()
  const [first, second] = plan.routes

  it('builds one line per route with the selected one drawn last', () => {
    const collection = routesToFeatureCollection(plan.routes, second!.id)
    expect(collection.features).toHaveLength(3)
    expect(collection.features.at(-1)?.properties).toMatchObject({
      routeId: second!.id,
      selected: true,
    })
    expect(collection.features.filter((f) => f.properties.selected)).toHaveLength(1)
  })

  it('finds a point along the line and bounds around every route', () => {
    expect(lineMidpoint(first!.geometry, 0)).toEqual(first!.geometry[0])
    const [[west, south], [east, north]] = routesBounds(plan.routes)
    for (const route of plan.routes) {
      for (const [lng, lat] of route.geometry) {
        expect(lng).toBeGreaterThanOrEqual(west)
        expect(lng).toBeLessThanOrEqual(east)
        expect(lat).toBeGreaterThanOrEqual(south)
        expect(lat).toBeLessThanOrEqual(north)
      }
    }
  })

  it('follows the theme for the auto basemap', () => {
    expect(basemapStyle('auto', 'dark')).toContain('dark-matter')
    expect(basemapStyle('auto', 'light')).toContain('positron')
    expect(basemapStyle('terrain', 'dark')).toContain('voyager')

    // Satellite is a style object: USGS imagery under a labels layer, the same in both themes.
    const satellite = basemapStyle('satellite', 'light')
    expect(typeof satellite).toBe('object')
    if (typeof satellite === 'string') return
    expect(satellite).toBe(basemapStyle('satellite', 'dark'))
    expect(JSON.stringify(satellite.sources)).toContain('USGSImageryTopo')
    // No CARTO raster labels: from a browser they're stamped "API KEY REQUIRED".
    expect(JSON.stringify(satellite)).not.toContain('cartocdn')
    expect(satellite.layers.at(-1)?.id).toBe(SATELLITE_LABELS_LAYER)
  })
})
