# Feature: routes

Plans the trip (`POST /api/routes/plan/`) and shows the three ranked routes.

- **API:** `planTripEndpoint`, `RoutesService.planTrip`, `routesKeys.plan(request)`,
  `useTripPlan(request)`, a cached query keyed by the request. The mock builds the plan with the
  mock engine (PDF thresholds, load rules and ranking) and returns 400 when origin = destination.
- **Selection:** `RouteSelectionProvider` / `useRouteSelection()` holds the selected route
  (defaults to the recommendation and resets on a new plan) and the selected checkpoint, with
  `stepCheckpoint(±1)`. The map and checkpoint tools share it.
- **Components:** `RouteList` (`full` | `peek`), `RouteCard` (rank badge, name and via, drive time,
  distance, `RiskStrip`, severe/high/moderate miles, Recommended/Fastest/Generated tags, reason
  chips from typed `ReasonFact`s, No Travel and beyond-forecast notes), `RouteListSkeleton`,
  `RouteListError` (retry).
- **Shared:** `components/risk-badge.tsx` (`RiskBadge`, `RiskDot`), `tests/fixtures.ts`.
- **Tests:** reason formatting, list selection and peek, `useTripPlan` success and error.

Not yet browser-verified (usage limit reached mid-check).
