# Feature: routes

Plans the trip (`POST /api/routes/plan/`) and shows the three ranked routes.

- **API:** `planTripEndpoint`, `RoutesService.planTrip`, `routesKeys.plan(request)`,
  `useTripPlan(request)`, a cached query keyed by the request. The mock builds the plan with the
  mock engine (PDF thresholds, load rules and ranking) and returns 400 when origin = destination.
- **Selection:** `RouteSelectionProvider` / `useRouteSelection()` holds the selected route
  (defaults to the recommendation and resets on a new plan) and the selected checkpoint, with
  `stepCheckpoint(±1)`. The map and checkpoint tools share it.
- **Components:** `RouteList` (`full` | `peek`), `RouteCard` (rank badge, name and via, drive time,
  distance, Recommended/Fastest/Generated tags on their own line under the time, `RiskStrip`,
  severe/high/moderate miles (wraps if wide), reason chips from typed `ReasonFact`s, No Travel and
  beyond-forecast notes), `RouteListSkeleton`, `RouteListError` (retry), and `RouteRail`.
  - `RouteRail` holds the numbered route buttons for the collapsed desktop planner. Each button has
    a mini risk strip; the recommended one is starred, and the selected one is filled.
  - It renders nothing without a plan.
- **Shared:** `components/risk-badge.tsx` (`RiskBadge`, `RiskDot`), `tests/fixtures.ts`.
- **Tests:** reason formatting, list selection and peek, `useTripPlan` success and error, the route
  rail (no plan, recommended, switching).

Verified in the browser: skeleton → ranked cards, selection, reason chips, No Travel notes. The
mock storms were retuned to peak 8–36h out so "tomorrow" trips show varied risk.
