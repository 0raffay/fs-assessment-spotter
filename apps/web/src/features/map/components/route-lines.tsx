import { useEffect } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'

import { useCssVariables } from '@/hooks/use-css-variables'
import type { Route, RouteId } from '@/types'

import { routesToFeatureCollection } from '../lib/geojson'
import { registerRouteArrow, ROUTE_ARROW_IMAGE } from '../lib/route-arrow'

interface RouteLinesProps {
  routes: readonly Route[]
  selectedId: RouteId
  showAlternates: boolean
}

/**
 * Alternates in gray underneath; the selected route in sky blue with a canvas casing and chevrons
 * showing the direction of travel.
 */
export function RouteLines({ routes, selectedId, showAlternates }: RouteLinesProps) {
  const colors = useCssVariables(['--route-selected', '--route-alternate', '--canvas'])
  const data = routesToFeatureCollection(routes, selectedId)
  const { current: map } = useMap()

  useEffect(() => (map ? registerRouteArrow(map.getMap()) : undefined), [map])

  return (
    <Source id="routes" type="geojson" data={data}>
      <Layer
        id="route-lines-alternate"
        type="line"
        filter={['==', ['get', 'selected'], false]}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showAlternates ? 'visible' : 'none',
        }}
        paint={{
          'line-color': colors['--route-alternate'],
          'line-width': 3.5,
          'line-opacity': 0.9,
        }}
      />
      <Layer
        id="route-lines-casing"
        type="line"
        filter={['==', ['get', 'selected'], true]}
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{ 'line-color': colors['--canvas'], 'line-width': 10 }}
      />
      <Layer
        id="route-lines-selected"
        type="line"
        filter={['==', ['get', 'selected'], true]}
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{ 'line-color': colors['--route-selected'], 'line-width': 5 }}
      />
      <Layer
        id="route-lines-arrows"
        type="symbol"
        filter={['==', ['get', 'selected'], true]}
        layout={{
          'symbol-placement': 'line',
          'symbol-spacing': 90,
          'icon-image': ROUTE_ARROW_IMAGE,
          'icon-size': 1.2,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-rotation-alignment': 'map',
          'icon-keep-upright': false,
        }}
      />
    </Source>
  )
}
