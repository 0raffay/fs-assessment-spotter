import { describe, expect, it } from 'vitest'

import { fixturePlan } from '@/tests/fixtures'

import { basemapStyleUrl } from '../basemaps'
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
    expect(basemapStyleUrl('auto', 'dark')).toContain('dark-matter')
    expect(basemapStyleUrl('auto', 'light')).toContain('positron')
    expect(basemapStyleUrl('terrain', 'dark')).toContain('voyager')
  })
})
