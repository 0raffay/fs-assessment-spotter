import 'maplibre-gl/dist/maplibre-gl.css'

import { AnimatePresence, motion } from 'motion/react'
import { LoaderCircleIcon, MapIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import MapGL, { Popup, type MapRef } from 'react-map-gl/maplibre'

import { useOptionalRouteSelection } from '@/features/routes'
import { useTheme } from '@/lib/theme'
import { panelTransition } from '@/lib/motion'

import { basemapStyleUrl } from '../lib/basemaps'
import { routesBounds } from '../lib/geojson'
import { clampPadding } from '../lib/padding'
import { ROUTE_LAYER_IDS } from '../lib/layers'
import { DEFAULT_LAYER_VISIBILITY, type TripMapProps } from '../types'

import { CheckpointCard } from './checkpoint-card'
import { CheckpointMarkers, PlacePins, RouteTags } from './map-markers'
import { RouteLines } from './route-lines'

/** Id for `useMap()` (react-map-gl's MapProvider), so controls outside the map can drive it. */
export const TRIP_MAP_ID = 'trip'

const INITIAL_VIEW = { longitude: -98.5, latitude: 38.8, zoom: 3.6 }

/** Room the checkpoint card needs beside its marker: to the right (popup) or above (docked). */
const CARD_ROOM = { popup: { right: 340, vertical: 200 }, docked: { top: 380 } } as const

/**
 * The map: basemap, routes, tags, pins, checkpoint markers and the checkpoint card. Reads the
 * plan and selection from `RouteSelection`; works (empty) without them.
 */
export function TripMap({
  padding,
  status,
  basemap = 'auto',
  layers = DEFAULT_LAYER_VISIBILITY,
  cardPlacement,
  children,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null)
  const { theme } = useTheme()
  const selection = useOptionalRouteSelection()
  const [cursor, setCursor] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  const plan = selection?.plan
  const selectedRoute = selection?.selectedRoute
  const checkpoint = selection?.selectedCheckpoint ?? null

  // Fit all routes into the clear area whenever a new plan arrives or the panels move.
  const planId = plan?.id
  const paddingKey = `${padding.top},${padding.right},${padding.bottom},${padding.left}`
  useEffect(() => {
    if (!plan || !loaded) return
    const map = mapRef.current
    if (!map) return
    const { width, height } = map.getContainer().getBoundingClientRect()
    map.fitBounds(routesBounds(plan.routes), {
      padding: clampPadding(padding, width, height),
      duration: 900,
    })
    // `paddingKey` stands for `padding`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, paddingKey, loaded])

  // Hide or show the basemap's place labels.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !loaded) return
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol' && !layer.id.startsWith('route')) {
        map.setLayoutProperty(layer.id, 'visibility', layers.placeLabels ? 'visible' : 'none')
      }
    }
  }, [layers.placeLabels, loaded, basemap, theme])

  // Bring a newly selected checkpoint into the clear area, with room for its card.
  const checkpointId = checkpoint?.id
  useEffect(() => {
    const map = mapRef.current
    if (!checkpoint || !loaded || !map) return
    const { width, height } = map.getContainer().getBoundingClientRect()
    const wanted =
      cardPlacement === 'popup'
        ? {
            ...padding,
            top: padding.top + CARD_ROOM.popup.vertical / 2,
            right: padding.right + CARD_ROOM.popup.right,
            bottom: padding.bottom + CARD_ROOM.popup.vertical / 2,
          }
        : { ...padding, top: Math.max(padding.top, CARD_ROOM.docked.top) }
    const room = clampPadding(wanted, width, height, 48)
    const point = map.project(checkpoint.coordinates)
    const visible =
      point.x >= room.left &&
      point.x <= width - room.right &&
      point.y >= room.top &&
      point.y <= height - room.bottom
    if (!visible) map.easeTo({ center: checkpoint.coordinates, padding: room, duration: 600 })
    // Only when the selection changes; `checkpointId` stands for `checkpoint`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpointId, loaded])

  // Escape closes the checkpoint card.
  useEffect(() => {
    if (!checkpoint) return
    const onKey = (event: KeyboardEvent) =>
      event.key === 'Escape' && selection?.selectCheckpoint(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [checkpoint, selection])

  const card =
    selection && selectedRoute && checkpoint ? (
      <CheckpointCard
        checkpoint={checkpoint}
        total={selectedRoute.checkpoints.length}
        routeMiles={selectedRoute.distanceMiles}
        loadWeightLb={selection.plan.request.loadWeightLb}
        onPrevious={() => selection.stepCheckpoint(-1)}
        onNext={() => selection.stepCheckpoint(1)}
        onClose={() => selection.selectCheckpoint(null)}
      />
    ) : null

  return (
    <div className="absolute inset-0">
      <MapGL
        id={TRIP_MAP_ID}
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        mapStyle={basemapStyleUrl(basemap, theme)}
        onLoad={() => setLoaded(true)}
        interactiveLayerIds={[...ROUTE_LAYER_IDS]}
        cursor={cursor}
        onMouseEnter={() => setCursor('pointer')}
        onMouseLeave={() => setCursor('')}
        onClick={(event) => {
          const routeId = event.features?.[0]?.properties?.routeId
          if (selection && typeof routeId === 'string') {
            const route = selection.plan.routes.find((r) => r.id === routeId)
            if (route) selection.selectRoute(route.id)
          }
        }}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        {plan && selectedRoute && selection ? (
          <RouteLines
            routes={plan.routes}
            selectedId={selectedRoute.id}
            showAlternates={layers.alternateRoutes}
          />
        ) : null}
        {/* After the route lines: injected layers (the heatmap) anchor beneath them with `beforeId`,
            and MapLibre needs that layer to exist first, including when a style change re-adds all. */}
        {children}
        {plan && selectedRoute && selection ? (
          <>
            <PlacePins origin={plan.request.origin} destination={plan.request.destination} />
            {layers.routeNumbers ? (
              <RouteTags
                routes={layers.alternateRoutes ? plan.routes : [selectedRoute]}
                selectedId={selectedRoute.id}
                onSelect={selection.selectRoute}
              />
            ) : null}
            {layers.checkpoints ? (
              <CheckpointMarkers
                checkpoints={selectedRoute.checkpoints}
                selectedId={checkpoint?.id ?? null}
                onSelect={selection.selectCheckpoint}
              />
            ) : null}
            {checkpoint && cardPlacement === 'popup' && card ? (
              <Popup
                longitude={checkpoint.coordinates[0]}
                latitude={checkpoint.coordinates[1]}
                anchor="left"
                offset={18}
                closeButton={false}
                closeOnClick={false}
                focusAfterOpen={false}
                maxWidth="320px"
                className="sr-popup"
              >
                {card}
              </Popup>
            ) : null}
          </>
        ) : null}
      </MapGL>

      <AnimatePresence>
        {cardPlacement === 'docked' && card ? (
          <motion.div
            key={checkpoint?.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={panelTransition}
            className="border-hairline-strong bg-surface-1 absolute top-3 right-[68px] left-3 z-10 mx-auto max-w-[340px] rounded-2xl border shadow-[0_18px_44px_rgb(0_0_0/0.5)]"
          >
            {card}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {status !== 'ready' ? (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
            style={{
              top: status === 'loading' ? 20 : '42%',
              paddingLeft: padding.left,
              paddingRight: padding.right,
            }}
          >
            <span
              role="status"
              className="border-hairline-strong bg-surface-1 text-ink-muted flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-[0_18px_44px_rgb(0_0_0/0.5)]"
            >
              {status === 'loading' ? (
                <>
                  <LoaderCircleIcon className="text-primary size-4 animate-spin" />
                  Finding routes and fetching forecasts
                </>
              ) : (
                <>
                  <MapIcon className="text-ink-subtle size-4" strokeWidth={1.75} />
                  Routes and weather risk appear here
                </>
              )}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
