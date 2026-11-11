import type { Map as MapLibreMap } from 'maplibre-gl'

/** Image id the direction-arrow layer asks for. */
export const ROUTE_ARROW_IMAGE = 'sr-route-arrow'

const SIZE = 24
const PIXEL_RATIO = 2

/**
 * A chevron pointing along +x (the line's direction under `symbol-placement: line`), white with a
 * soft dark edge so it reads on the sky-blue route in both themes. `null` without a 2D canvas.
 */
export function drawRouteArrow(): ImageData | null {
  const px = SIZE * PIXEL_RATIO
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(PIXEL_RATIO, PIXEL_RATIO)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const chevron = () => {
    ctx.beginPath()
    ctx.moveTo(9, 7)
    ctx.lineTo(14.5, 12)
    ctx.lineTo(9, 17)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(8, 47, 73, 0.55)'
  ctx.lineWidth = 4.5
  chevron()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.25
  chevron()
  return ctx.getImageData(0, 0, px, px)
}

/**
 * Adds the arrow image now (if the style is ready) and whenever the style asks for it again,
 * e.g. after a basemap or theme change replaces the style. Returns a cleanup function.
 */
export function registerRouteArrow(map: MapLibreMap): () => void {
  const add = () => {
    if (map.hasImage(ROUTE_ARROW_IMAGE)) return
    const image = drawRouteArrow()
    if (image) map.addImage(ROUTE_ARROW_IMAGE, image, { pixelRatio: PIXEL_RATIO })
  }
  const onMissing = (event: { id: string }) => {
    if (event.id === ROUTE_ARROW_IMAGE) add()
  }
  map.on('styleimagemissing', onMissing)
  if (map.isStyleLoaded()) add()
  return () => {
    map.off('styleimagemissing', onMissing)
  }
}
