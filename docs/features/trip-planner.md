# Feature: trip-planner

Collects the PDF's inputs (origin, destination, departure, load weight) plus the checkpoint
interval, and owns the page that composes every other feature.

## Flow

1. The person searches origin and destination (`GET /api/geocode/?q=`), picks a date and time (in
   the **origin's** time zone), enters the load and picks 10 / 25 / 50 mi.
2. On submit the form is validated with zod (`tripFormSchema`) and converted to a `TripRequest`.
3. The request is stored in the URL (`?trip=<base64url JSON>`), so reloads keep the trip and
   **Share** copies a link that reopens it. The URL value is validated with
   `tripRequestSchema` on the way in; a bad or edited link simply shows the empty form.
4. The planner switches to the trip summary, with the route list (from `routes`) underneath.

## Validation rules

| Field       | Rule                                                              |
| ----------- | ----------------------------------------------------------------- |
| Origin      | Required                                                          |
| Destination | Required, and different from the origin                           |
| Date / time | Valid, and not more than 30 minutes in the past                   |
| Load weight | Whole pounds, 1–80,000 lb (80,000 lb is the usual US gross limit) |
| Interval    | 10, 25 or 50 miles                                                |

## API

| File                        | Contents                                                     |
| --------------------------- | ------------------------------------------------------------ |
| `trip-planner.endpoints.ts` | `geocodeEndpoint` (`GET /geocode/`)                          |
| `trip-planner.service.ts`   | `TripPlannerService.searchPlaces(query, signal)`             |
| `trip-planner.keys.ts`      | `tripPlannerKeys.places(query)`                              |
| `trip-planner.api.ts`       | `usePlaceSearch(query)`: debounced 250ms, idle under 2 chars |
| `trip-planner.mock.ts`      | Searches a built-in list of ~45 US cities                    |

## Components

- `TripPlannerPanel`: form while editing, otherwise summary + `results` slot.
- `PlannerSurface`:
  - **Desktop:** a floating left panel. Collapsing it leaves a 56px rail with an expand button and
    the page's `collapsed` slot (the `RouteRail`); map padding and the bottom dock shift to start
    after the rail.
  - **Phone:** a floating bottom sheet with peek/half/full snaps.
  - **Tablet:** a tall bottom-left sheet.
- `TripForm`, `PlaceField` (on the generic `SearchCombobox<T>`), `DepartureFields`,
  `LoadWeightField`, `IntervalToggle`, `FormField`, `RouteConnector`.
- `TripSummary`, `TripChip` (header-left).

## State (`TripPlannerProvider` / `useTripPlanner`)

`request`, `submit`, `isEditing` / `startEditing` / `cancelEditing`, `isPanelOpen` /
`setPanelOpen`, `sheetSnap` / `setSheetSnap`.

## Shared pieces added with this feature

- `components/search-combobox.tsx`: generic, accessible (WAI-ARIA combobox) search-as-you-type.
  Enter mid-search picks the highlighted match and never submits the surrounding form.
- `hooks/use-search-param-state.ts`: typed, zod-validated URL state.
- `hooks/use-debounced-value.ts`, `lib/time.ts` (wall-clock ↔ UTC in a named time zone).

## Issues found in the browser and fixed

- A closing dropdown kept its Radix wrapper under the pointer and swallowed the click on the next
  field. Fixed globally in `index.css` (closing popper wrappers ignore the pointer) and by stopping
  the popover from moving focus when it closes.
- The list briefly said "No places match" while the debounce was pending; it now says "Searching…".
- The time field showed two clock icons and clipped the time; the custom icon was removed.

## Tests

`types/tests/trip-form-schema.test.ts` (validation and conversion), `components/tests/
trip-planner-panel.test.tsx` (search → fill → submit → URL; validation errors; restoring and editing
a shared trip), `lib/tests/time.test.ts`.
