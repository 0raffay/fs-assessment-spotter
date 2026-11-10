# Frontend structure (`apps/web`)

React 19 + Vite + TypeScript, with Tailwind CSS, TanStack Query, axios and React Router.

```
apps/web/src/
├── main.tsx                         Entry point: renders <App/>
├── index.css                        Tailwind entry
├── app/                             App shell (wiring only, no feature logic)
│   ├── app.tsx                      Providers + RouterProvider
│   ├── providers.tsx                App-wide providers (TanStack Query client)
│   └── router.tsx                   Maps ROUTES to feature pages
├── components/                      Shared, feature-agnostic UI (button, card, spinner…)
├── lib/
│   ├── api/
│   │   ├── index.ts                 The single axios agent + ApiError
│   │   └── tests/
│   │       └── index.test.ts
│   ├── routes.ts                    ROUTES: every page URL, defined once
│   └── tests/
│       └── routes.test.ts
├── features/
│   └── <feature-name>/              One folder per feature (see below)
└── tests/
    └── setup.ts                     Vitest global setup
```

## Tests

Tests go in a **`tests/` folder inside the folder whose code they test**, never loose next to
source files. Name each file after the file it covers: `routes.ts` → `tests/routes.test.ts`, and
`components/route-card.tsx` → `components/tests/route-card.test.tsx`. Import the code under test
with a relative path (`../routes`). Vitest finds every `*.test.ts(x)` automatically.

## A feature folder

```
features/<feature-name>/
├── index.ts                         Public exports for other features
├── page/
│   └── index.tsx                    The routed page (only if the feature has a URL)
├── components/
│   ├── <feature-specific>.tsx       UI used only by this feature
│   └── tests/
│       └── <feature-specific>.test.tsx
├── context/
│   └── <feature-name>-context.tsx   Shared state for this feature's components (optional)
└── api/
    ├── <feature-name>.service.ts    Class of static methods that call the axios agent
    ├── <feature-name>.keys.ts       TanStack Query keys
    ├── <feature-name>.api.ts        React Query hooks: useXQuery / useXMutation
    └── tests/
        └── <feature-name>.service.test.ts
```

Only create the folders a feature needs. A feature without a URL has no `page/`, and
`context/` is only for state shared by several of its components.

### The `api/` layer: three files, one direction

```
component → <feature>.api.ts (hooks) → <feature>.service.ts → lib/api (axios) → Django
                    ↑
             <feature>.keys.ts
```

| File                   | Holds                                                                  | Imports                 |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------- |
| `<feature>.service.ts` | `class XService { static … }`: one method per endpoint, returns `data` | `@/lib/api`             |
| `<feature>.keys.ts`    | `xKeys` object of query-key builders                                   | nothing                 |
| `<feature>.api.ts`     | `useX…` hooks wrapping the service with `useQuery`/`useMutation`       | service, keys, TanStack |

Rules:

- **Components only import hooks** from `<feature>.api.ts`. They never call a service or axios
  directly.
- **Services have no React in them.** Static methods only, and they return the response
  `data`, not the axios response.
- **All requests go through the shared agent** in `@/lib/api`. Request/response types live in the
  service file next to the methods that use them, or in `<feature>.types.ts` if they grow.
- Errors arrive as `ApiError` (`status`, `data`), because the agent's interceptor converts them.

Example (`features/health/`):

```ts
// health.service.ts
export class HealthService {
  static async getStatus(): Promise<HealthStatus> {
    const { data } = await api.get<HealthStatus>("/health/");
    return data;
  }
}

// health.keys.ts
export const healthKeys = {
  all: ["health"] as const,
  status: () => [...healthKeys.all, "status"] as const,
};

// health.api.ts
export const useHealthStatus = () =>
  useQuery({ queryKey: healthKeys.status(), queryFn: HealthService.getStatus });
```

## Page routes: `lib/routes.ts`

`ROUTES` is the only place a URL string is written. Each entry is a function:

```ts
export const ROUTES = {
  routePlanner: (params?: { from?: string; to?: string }) =>
    withSearch("/", params),
  // Path params default to their placeholder, so a no-arg call gives the router pattern:
  // trip: (tripId = ':tripId') => `/trips/${tripId}`,
};
```

- **Navigating or linking:** `navigate(ROUTES.routePlanner({ from: 'Dallas' }))`,
  `<Link to={ROUTES.trip(id)}>`.
- **Registering in the router** (`app/router.tsx`): `{ path: ROUTES.trip(), element: <TripPage /> }`.
- `withSearch()` adds search params and skips empty values.

## Naming conventions

| Thing             | Convention                                              | Example                                  |
| ----------------- | ------------------------------------------------------- | ---------------------------------------- |
| Files and folders | **kebab-case**                                          | `api-status-badge.tsx`, `route-planner/` |
| Feature api files | `<feature>.<role>.ts`                                   | `route-planner.service.ts`               |
| Components        | PascalCase export, named                                | `export function ApiStatusBadge`         |
| Hooks             | `use` + camelCase                                       | `usePlanRoutes`                          |
| Service classes   | PascalCase + `Service`                                  | `RoutePlannerService`                    |
| Query key objects | camelCase + `Keys`                                      | `routePlannerKeys`                       |
| Constants         | UPPER_SNAKE_CASE                                        | `ROUTES`                                 |
| Tests             | `tests/` folder in the same folder, `<file>.test.ts(x)` | `lib/tests/routes.test.ts`               |

Other conventions:

- **Named exports only**, no default exports.
- **Import with the `@/` alias** (`@/lib/api`, `@/features/health`), not long relative paths.
  Inside a feature, short relative imports (`../api/health.api`) are fine.
- **Features don't reach into each other.** Import another feature only through its `index.ts`.
  If two features need the same thing, move it to `components/` or `lib/`.
- `components/` holds presentational, reusable UI with no feature knowledge and no data fetching.
