# Feature: forecast

The weather heatmap over the trip corridor and the 0–48 hour forecast timeline.

## Data

- `GET /api/weather/heatmap/?west&south&east&north&hours=48&loadWeightLb` returns a grid of 0.5°
  cells. Each cell has one `RiskIndex` per hour (49 values), for each measure: `risk`
  (load-adjusted overall), `wind`, `rain`, `snow`. It also returns `worstByHour`, the worst overall
  risk of any cell for each hour.
- `useHeatmap(plan)` fetches it once per plan. The slider never refetches.
- The mock (`mocks/engine/heatmap.ts`) uses the same storms and rules as the trip-plan mock, so the
  map and the route cards agree.

## Rendering (performance)

`HeatmapLayer` builds the GeoJSON once, flattening hourly levels into numeric properties (`r0`…`r48`,
`w0`…, `p0`…, `s0`…). MapLibre serializes nested arrays in properties, so flat keys are what make
`['get', 'r14']` work. Moving the slider only changes the property name in the `fill-color` and
`fill-opacity` expressions: no data rebuild and no React re-render of the map. The layer sits under
the route lines (`beforeId`). Opacity per level is low for calm cells and higher for dangerous
ones, so calm areas stay quiet.

## UI

- **Forecast dock:** a chip ("Wed 21:00 · +21h") when closed and the panel when open. On desktop it
  floats between the planner and the right edge, opens by default and enlarges the map's fit padding
  while open. On phones it sits above the sheet, and opening it drops the sheet to peek.
- **Forecast panel:** the hour in large light type with its zone and `+Nh`; play/pause (one hour
  every 600 ms, stopping at +48h), previous/next hour, close; 49 **worst-risk bars** (taller =
  worse, the current hour outlined, click to jump); the slider; clock-time ticks; Depart/Arrive
  markers and the drive window shaded for the selected route; the risk legend. Compact mode
  (handheld) drops prev/next and the legend.
- **Initial hour:** the plan's departure hour, so the heatmap opens at the moment the truck leaves.

## State

`ForecastProvider` (remounted per plan with a `key`) holds `hour`, `setHour`, `step`, `isPlaying`,
`togglePlay`, `isOpen`, `setOpen`; read it with `useForecast()` or `useOptionalForecast()`.

## Accessibility

The generated shadcn Slider has no prop for its thumb's name, so the panel labels the thumb
("Heatmap forecast hour") and sets `aria-valuetext` ("plus 14 hours, Thu 06:00") on it directly. The
hour readout is an `aria-live` region. Arrow keys move one hour.

## Issues found in the browser and fixed

- The heatmap was too heavy over large storms; per-level opacity was lowered.
- On phones the compact header overlapped its controls; prev/next were dropped in compact mode, and
  the sheet now peeks when the forecast opens. The map's fit padding counts the open panel.

## Tests

Timeline helpers, the heatmap mock against the contract (`worstByHour` = max per hour), and the
panel: labels, step/clamp/close, and playback with fake timers.
