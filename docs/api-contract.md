# API contract

The frontend is built against this contract. Until the Django endpoints exist, MSW serves them in
the browser from the same definitions (`VITE_ENABLE_MOCKS=true`). To switch to the real backend, set
`VITE_ENABLE_MOCKS=false` in `apps/web/.env` and start Django. Nothing else changes.

**The contract is code.** Each endpoint is a `defineEndpoint({ method, path, query, body, response })`
object with zod schemas, in `apps/web/src/features/<feature>/api/<feature>.endpoints.ts`. Shared
schemas live in `apps/web/src/types/domain.ts`. The frontend validates every request before sending
it and every response before using it, and mocks are validated against the same schemas.

## Conventions

- **Base URL:** `/api` (proxied to Django in development).
- **Paths:** end with a trailing slash (Django style).
- **JSON field names:** camelCase. Configure DRF with a camelCase renderer/parser, or map in
  serializers.
- **Times:** ISO-8601 with an offset, e.g. `2026-11-12T12:00:00Z`. The client formats them in each
  place's `timeZone`.
- **Units:** miles, minutes, mph, inches per hour, pounds.
- **Errors:** any non-2xx response has the body `{ "detail": string, "code"?: string,
"fieldErrors"?: { [field]: string[] } }`. Validation errors are 400 and include `fieldErrors`.

## Shared objects

```ts
type RiskLevel = "low" | "moderate" | "high" | "severe" | "no_travel"; // ordered safest → worst
type RiskIndex = 0 | 1 | 2 | 3 | 4; // compact form of RiskLevel
type WeatherCondition = "wind" | "rain" | "snow";
type LngLat = [longitude: number, latitude: number];
type BBox = [west: number, south: number, east: number, north: number];

interface Place {
  id: string; // stable id from the geocoder
  name: string; // "Dallas"
  region: string; // "TX"
  coordinates: LngLat;
  timeZone: string; // IANA, e.g. "America/Chicago"
}
```

## `GET /api/geocode/`

Location search for the origin and destination fields.

| Query | Type   | Notes            |
| ----- | ------ | ---------------- |
| `q`   | string | 2–100 characters |

Response `200`:

```ts
{ results: Place[] } // at most 6, best match first
```

## `POST /api/routes/plan/`

Plans three routes and scores them for weather risk.

Body:

```ts
{
  origin: Place;
  destination: Place;
  departureAt: string; // ISO with offset
  loadWeightLb: number; // integer, 1–80,000
  intervalMiles: 10 | 25 | 50;
}
```

Response `200` (`TripPlan`):

```ts
{
  id: string
  request: <the body above>
  routes: Route[]            // ranked, routes[0] is the recommendation
  recommendedRouteId: string
  reasons: ReasonFact[]      // why routes[0] won
  bbox: BBox                 // padded box around all routes, for the heatmap request
  forecastIssuedAt: string   // forecast run used (hour 0 of the heatmap)
  generatedAt: string
}

interface Route {
  id: string
  rank: number               // 1 = recommended
  name: string               // "Northern route"
  via: string                // "via Amarillo, Pueblo"
  distanceMiles: number
  durationMinutes: number
  departureAt: string
  arrivalAt: string
  geometry: LngLat[]         // the line to draw
  checkpoints: Checkpoint[]  // every `intervalMiles`, starting at mile 0
  riskMiles: Record<RiskLevel, number>
  averageRisk: number        // mean RiskIndex over checkpoints with a forecast
  isRecommended: boolean
  isFastest: boolean
  isGenerated: boolean       // true if made because the routing API returned fewer than 3
}

interface Checkpoint {
  id: string
  index: number
  mile: number
  segmentMiles: number       // road this checkpoint stands for (to the next one)
  coordinates: LngLat
  locationLabel: string      // "near Salina, KS"
  eta: string
  timeZone: string
  forecast:
    | {
        status: 'available'
        forecastHour: string                        // forecast hour used for the ETA
        weather: Record<WeatherCondition, number>   // wind mph, rain/snow in/hr
        conditionLevels: Record<WeatherCondition, RiskLevel>
        level: RiskLevel                            // worst of the three, after load rules
        decidedBy: WeatherCondition                 // which condition set `level`
        loadRuleApplied: boolean                    // load weight raised the wind level
      }
    | { status: 'unavailable' }                     // ETA beyond the forecast range
}

type ReasonFact =
  | { kind: 'fewest_miles'; level: RiskLevel; miles: number; othersMiles: number[] }
  | { kind: 'lowest_average_risk'; value: number; othersValues: number[] }
  | { kind: 'shortest_time'; minutes: number }
  | { kind: 'time_vs_fastest'; deltaMinutes: number }
```

Errors: `400` for invalid input (e.g. same origin and destination), `502` when the routing or
weather provider fails, `503` when it times out.

## `GET /api/weather/heatmap/`

Hourly risk grid for the forecast slider (hours 0–48 from `forecastIssuedAt`).

| Query                            | Type   | Notes                                      |
| -------------------------------- | ------ | ------------------------------------------ |
| `west`, `south`, `east`, `north` | number | The plan's `bbox`                          |
| `hours`                          | int    | 1–48 (default 48)                          |
| `loadWeightLb`                   | int    | Needed because load rules change wind risk |

Response `200`:

```ts
{
  bbox: BBox
  cellSizeDegrees: number           // 0.5
  startsAt: string                  // = plan.forecastIssuedAt
  hours: number
  cells: Array<{
    id: string
    bounds: BBox
    // One RiskIndex per hour (length = hours + 1), per heatmap measure.
    levels: { risk: RiskIndex[]; wind: RiskIndex[]; rain: RiskIndex[]; snow: RiskIndex[] }
  }>
  worstByHour: RiskIndex[]          // worst `risk` over all cells, per hour
}
```
