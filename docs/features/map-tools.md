# Feature: map-tools

The floating tool rail at the top right of the map and the panels it opens. This feature makes no
requests. It holds view settings that the map, forecast and checkpoint features read.

## State (`MapToolsProvider`)

| Field         | Type                                | Default                | Read by                   |
| ------------- | ----------------------------------- | ---------------------- | ------------------------- |
| `activePanel` | `MapPanel \| null`                  | `null`                 | overlay, rail, sheet peek |
| `basemap`     | `Basemap` (auto/dark/light/terrain) | `auto` (follows theme) | `TripMap`                 |
| `layers`      | `MapLayerVisibility`                | all on                 | `TripMap`                 |
| `heatmap`     | `{ visible, measure, opacity }`     | on, `risk`, 1          | `HeatmapLayer`            |

- `togglePanel(id)` opens one panel at a time. Pressing the same button again or Escape closes it.
- `setLayer` and `setHeatmap` are generic over their key (`<K extends keyof T>(key: K, value: T[K])`),
  so a wrong value type fails at compile time.
- The provider sits above `PlannerScreen`, so settings survive a re-plan.

## Components

- **`ToolRail<TId>`:** a generic vertical toolbar (`role="toolbar"`), built from
  `ToolDefinition<TId>[]`. Each definition has an id, label (tooltip and aria-label), icon,
  `pressed`, `disabled`, `separated` and `onSelect`.
- **`MapToolRail`:** the concrete rail.
  - Layers, Forecast (toggles the forecast dock), Legend, Checkpoints, Risk profile (desktop only),
    then Fit all routes and Zoom ± (desktop only).
  - It drives the map through `useMap()[TRIP_MAP_ID]`, so it needs `MapProvider` from
    `react-map-gl`.
  - Plan tools are disabled until a plan exists.
- **`LayersPanel`:** the heatmap switch, a measure segment (Risk / Wind / Rain / Snow), an opacity
  slider (20–150%), switches for alternate routes, checkpoints, route numbers and place labels, and
  basemap swatches (a radio group).
- **`LegendPanel`:** risk levels with their colours and the map symbols.
- **`MapToolsOverlay`:** the rail plus the open panel beside it.
  - Other features pass their panels through `extraPanels` (`checkpoints`; `profile` renders in the
    bottom dock, not here).

## Layout

- **Desktop:** the rail is at `top-4 right-4` and panels open 300 px wide to its left.
- **Phones and tablets:** the rail drops profile and zoom and uses 44 px targets.
  - Opening a panel drops the sheet to peek (`SheetAutoPeek`), so the panel doesn't cover the
    route list.

## Tests

- `components/tests/tool-rail.test.tsx`: roles, pressed and disabled states, typed ids.
- `components/tests/map-tools-overlay.test.tsx`:
  - Tools are disabled without a plan.
  - The compact rail.
  - One panel at a time, and Escape closes it.
  - Measure, layer, basemap and heatmap switches update state.
