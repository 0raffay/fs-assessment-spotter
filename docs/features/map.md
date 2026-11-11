# Feature: map

The map that fills the frame: basemap, the three routes, checkpoints and the checkpoint card.

- **Library:** MapLibre GL 6 through `react-map-gl/maplibre`.
- **Basemaps:**
  - **Map** (`auto`, follows the theme): CARTO Dark Matter or Positron.
  - **Terrain:** CARTO Voyager.
  - **Satellite:** USGS National Map orthoimagery, with CARTO's labels-only raster on top.
    - The imagery is US public domain, needs no key, covers only the US, and has detail to zoom 16.
    - It's a style object built in `lib/basemaps.ts`, not a URL.
    - On imagery, alternate routes turn white, the selected route gets a dark casing, and the
      heatmap is 1.4× stronger.
    - "Place labels" also hides the labels raster.
  - No basemap needs a key. Attribution is shown in the map corner.
- **Routes:** one GeoJSON source. Alternates are drawn in gray underneath; the selected route is sky
  blue with a canvas casing and white chevrons pointing the way (`route-lines-arrows`, a symbol layer
  whose image is drawn on a canvas and re-added on `styleimagemissing` after style changes).
  Clicking a line or its numbered tag selects that route. Injected layers (the heatmap) render after
  the route lines so their `beforeId` anchor always exists.
- **Checkpoints:** a DOM marker per checkpoint on the selected route, colored by its risk at the ETA
  (gray when beyond the forecast range). They fade in one after another, scale on hover and keyboard
  focus, and the selected one pulses in its risk color.
- **Start and Arrive (`TripEndpoints`):**
  - A sky-ringed start pin and a dark flag pin, each with a two-line label: "Start · Pueblo, CO" over
    "Thu 06:00 MST", and "Arrive · Houston, TX" over the selected route's arrival time in the
    destination's zone.
  - They sit above the checkpoint dots.
  - Each label sits to the right of its pin, or to the left when the pin is in the right half of
    the map, so it never runs off the edge. This is re-checked after every move. The marker keeps a
    fixed center anchor (react-map-gl reads `anchor` only once), and the label is placed with CSS.
- **Fit:**
  - On a new plan, the map fits all routes into the area the floating UI leaves clear
    (`useMapPadding` in `trip-planner`).
  - That clear area includes the measured bottom dock and any open rail panel. Spare width is kept
    for the endpoint labels.
  - `clampPadding` stops a narrow window zooming out to the whole continent.
- **Selecting a checkpoint** eases the map to it when it's outside the clear area, leaving room for
  its card.
- **Checkpoint card:** a popup next to the marker on desktop, docked at the top on phones and
  tablets (the phone sheet drops to peek so it has room). It shows the ETA, mile and location,
  wind/rain/snow tiles with 5-step meters, which condition decides the level, whether the load rule
  applied, and the forecast hour. Previous/next step along the route; Escape closes it.
- **Colors on the canvas:** MapLibre can't read `var(--x)`, so `useCssVariables()` resolves design
  tokens to real colors and re-reads them on theme change.

## Public API

`TripMap` (`padding`, `status`, `basemap?`, `layers?`, `cardPlacement`, `children?` for extra layers
such as the forecast heatmap), `CheckpointCard`, `BASEMAPS`, `DEFAULT_LAYER_VISIBILITY`, geometry
helpers, and the types `Basemap`, `MapLayerVisibility`, `MapPadding`, `MapStatus`, `TripMapProps`.

## Issues found in the browser and fixed

- MapLibre 6 loads its worker by a URL relative to its own module, so Vite's dependency
  pre-bundling broke it (no basemap, no fitting). `maplibre-gl` is excluded from `optimizeDeps`.
- The popup auto-focused its first button, flashing a tooltip; turned off with `focusAfterOpen`.
- On phones the docked card sat under the half-height sheet; opening a checkpoint now peeks the
  sheet. Badge and mile text no longer wrap mid-phrase.
- On a style change, the heatmap was added before its route-lines anchor (MapLibre threw); fixed by
  layer order.
- A checkpoint near the right edge opened its card behind the checkpoint list; the padding now
  includes open panels and the map pans to the checkpoint.
- Hard-coded dock heights were wrong (214 vs 245 px), so routes ended under the forecast; the dock
  is now measured.

## Tests

Geometry/basemap helpers and the checkpoint card (details, prev/next/close, no-forecast state).
MapLibre needs WebGL, which jsdom lacks, so the canvas itself is covered by the Playwright suite.
