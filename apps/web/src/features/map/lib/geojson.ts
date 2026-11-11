import type { Feature, FeatureCollection, LineString } from 'geojson'

import type { LngLat, Route, RouteId } from '@/types'

export interface RouteLineProperties {
  routeId: RouteId
  rank: number
  selected: boolean
}

/** All routes as one FeatureCollection; the selected one last so it draws on top. */
export function routesToFeatureCollection(
  routes: readonly Route[],
  selectedId: RouteId,
): FeatureCollection<LineString, RouteLineProperties> {
  const features: Feature<LineString, RouteLineProperties>[] = routes.map((route) => ({
    type: 'Feature',
    properties: { routeId: route.id, rank: route.rank, selected: route.id === selectedId },
    geometry: { type: 'LineString', coordinates: route.geometry.map(([lng, lat]) => [lng, lat]) },
  }))
  features.sort((a, b) => Number(a.properties.selected) - Number(b.properties.selected))
  return { type: 'FeatureCollection', features }
}

/** The vertex halfway along a line (by vertex count), for the route-number tag. */
export function lineMidpoint(geometry: readonly LngLat[], at = 0.5): LngLat {
  const point = geometry[Math.floor((geometry.length - 1) * at)]
  if (!point) throw new Error('Empty geometry')
  return point
}

/** `[[west, south], [east, north]]` around every route. */
export function routesBounds(routes: readonly Route[]): [[number, number], [number, number]] {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const route of routes) {
    for (const [lng, lat] of route.geometry) {
      west = Math.min(west, lng)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      north = Math.max(north, lat)
    }
  }
  return [
    [west, south],
    [east, north],
  ]
}
