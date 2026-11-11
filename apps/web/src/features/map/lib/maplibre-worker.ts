/**
 * Tells MapLibre where its web worker lives.
 *
 * MapLibre 6 builds its worker URL at runtime (`new URL('./maplibre-gl-worker.mjs',
 * import.meta.url)`), which a bundler can't see. Production builds therefore never emitted the
 * file, and the map stayed blank ("Worker failed to load"). Importing it with `?url` makes Vite copy
 * the worker into the build and give us its real URL. It must run before the first map is created,
 * so `trip-map.tsx` imports this module for its side effect.
 */
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

setWorkerUrl(workerUrl)
