import { Layer, Source } from 'react-map-gl/maplibre'

import { useCssVariables } from '@/hooks/use-css-variables'
import type { Route, RouteId } from '@/types'

import { routesToFeatureCollection } from '../lib/geojson'

interface RouteLinesProps {
  routes: readonly Route[]
  selectedId: RouteId
  showAlternates: boolean
}

/** Alternates in gray underneath; the selected route in sky blue with a canvas casing. */
export function RouteLines({ routes, selectedId, showAlternates }: RouteLinesProps) {
  const colors = useCssVariables(['--route-selected', '--route-alternate', '--canvas'])
  const data = routesToFeatureCollection(routes, selectedId)

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
    </Source>
  )
}
