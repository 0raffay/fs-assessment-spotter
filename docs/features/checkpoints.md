# Feature: checkpoints

Two views of the selected trip's checkpoints, opened from the map tool rail: the **checkpoint
list** (a side panel) and the **risk profile** (the bottom dock, desktop only). This feature makes
no requests. It reads the plan and selection from `RouteSelectionProvider`, so the list, the
profile, the map markers and the checkpoint card always show the same selection.

## Types (`types/index.ts`)

- `CHECKPOINT_FILTERS = ['all', 'moderate', 'high']`, and `CheckpointFilter`.
- `ProfileSegment<TId>`: a strip block with `start` and `width` (0 to 1 shares of the longest
  route) and `level` (`null` when the ETA is past the forecast range).

## Logic (`lib/checkpoints.ts`)

- `filterCheckpoints(checkpoints, filter)`: "All", or levels at or above Moderate or High
  (`atLeast` from `lib/risk`). Checkpoints without a forecast only appear under "All".
- `countByFilter(checkpoints)`: the counts shown in the filter segment.
- `profileSegments(route, scaleMiles)`: one segment per checkpoint covering `segmentMiles`, clipped
  at the route's end and scaled to the longest route, so strips line up mile for mile.
- `longestRoute(routes)`: that shared scale.

## Components

- **`CheckpointList`:**
  - A header ("Route 1 · 33 stops, every 25 mi") and an `All | Moderate+ | High+` filter with
    counts.
  - Rows show the mile (mono), the ETA in the checkpoint's own zone, what decides the level (with
    the load rule and location), and the risk level.
  - Picking a row selects the checkpoint (map card and marker follow). The selected row is
    highlighted and scrolled into view when the selection changes elsewhere.
  - `onPicked` lets handheld layouts close the panel so the docked card is visible.
- **`RiskProfile`:**
  - One strip per route; the selected route is taller.
  - Each segment is a button: clicking one on any route selects that route and checkpoint (via
    `selectCheckpoint(id, routeId)`).
  - A marker line and a "mi 350" pill track the selected checkpoint across all routes. With
    nothing selected, the axis shows 0, half and full miles.
- **`RiskProfileDock`:** the profile in a floating panel in the bottom dock. It accepts a `ref`; the
  page measures its height (`useElementHeight`) to pad the map.

## Tests

- `lib/tests/checkpoints.test.ts`: filters, counts, segment scaling and clipping, zero-scale
  guard.
- `components/tests/checkpoint-list.test.tsx`: summary, filtering, selection sync, callbacks.
- `components/tests/risk-profile.test.tsx`: a strip per route, cross-route selection, route label
  selection, close.
