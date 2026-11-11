# Feature: map

The map that fills the frame: basemap, the three routes, checkpoints and the checkpoint card.

- **Library:** MapLibre GL 6 through `react-map-gl/maplibre`.
- **Basemaps (CARTO, no key):** Dark Matter (dark theme), Positron (light theme), Voyager
  ("terrain"). `basemap="auto"` follows the theme.
- **Routes:** one GeoJSON source. Alternates are drawn in gray underneath; the selected route is sky
  blue with a canvas casing. Clicking a line or its numbered tag selects that route.
- **Checkpoints:** a DOM marker per checkpoint on the selected route, colored by its risk at the ETA
  (gray when beyond the forecast range). They fade in one after another, scale on hover and keyboard
  focus, and the selected one pulses in its risk color.
- **Pins:** origin (open circle) and destination (filled square) with labels.
- **Fit:** on a new plan, the map fits all routes into the area the floating UI leaves clear
  (`useMapPadding` in `trip-planner`).
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

## Tests

Geometry/basemap helpers and the checkpoint card (details, prev/next/close, no-forecast state).
MapLibre needs WebGL, which jsdom lacks, so the canvas itself is covered by the Playwright suite.
