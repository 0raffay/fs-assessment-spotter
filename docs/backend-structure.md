# Backend structure (`apps/api`)

Django 5.2 LTS + Django REST Framework, managed with uv.

```
apps/api/
├── manage.py                     Uses config.settings.dev by default
├── pyproject.toml                Dependencies, Ruff and pytest config
├── uv.lock                       Locked versions (commit it)
├── .env.example
├── config/                       Project configuration, not a Django app
│   ├── settings/
│   │   ├── base.py               Shared settings, read from env (django-environ)
│   │   ├── dev.py                Local defaults, browsable API
│   │   ├── test.py               In-memory DB for pytest
│   │   └── prod.py               Security hardening, logging
│   ├── urls.py                   Root URLs: mounts each app's api/urls.py under /api/
│   ├── wsgi.py
│   └── asgi.py
└── apps/                         Django apps, one per domain, imported as `apps.<name>`
    └── <app_name>/
```

## A domain app

```
apps/<app_name>/
├── __init__.py
├── apps.py                       AppConfig (name = "apps.<app_name>")
├── api/                          HTTP layer: thin, no business logic
│   ├── __init__.py
│   ├── serializers.py            Validate requests, shape responses
│   ├── views.py                  DRF APIViews: parse → call service → serialize
│   └── urls.py                   app_name + urlpatterns
├── services/                     Business logic: plain Python, no HTTP or DRF imports
│   ├── __init__.py
│   └── <use_case>.py
├── clients/                      Wrappers for third-party APIs (routing, weather…)
│   ├── __init__.py
│   └── <provider>_client.py
├── types.py                      Dataclasses passed between layers (optional)
├── models.py                     Only if the app stores data
├── selectors.py                  Database reads (only if there are models)
├── admin.py                      Only if there are models
├── migrations/
└── tests/
    ├── __init__.py
    ├── test_<use_case>.py        Service unit tests (most tests go here)
    └── test_api.py               Endpoint tests via APIClient
```

Only create the modules an app needs. An app without models has no `models.py`,
`selectors.py`, `admin.py` or `migrations/`.

### Layers and dependency direction

```
api/views.py → services/ → clients/ (external HTTP)
     ↓              ↓
api/serializers.py  selectors.py / models.py (database)
```

| Layer          | Does                                                         | Must not                              |
| -------------- | ------------------------------------------------------------ | ------------------------------------- |
| `api/`         | Validate input, call one service, serialize the result       | Hold business rules or call clients   |
| `services/`    | Domain logic: orchestration, calculations, rules             | Import DRF, `request`, or serializers |
| `clients/`     | Talk to one external API, return typed data, handle timeouts | Contain business rules                |
| `selectors.py` | Read queries that return model instances or querysets        | Write to the database                 |

Why: the domain rules (risk thresholds, load rules, route ranking) are the most important code.
Keeping them in plain functions means they can be unit-tested with plain inputs, with no HTTP,
no database and no mocked requests. External APIs sit behind `clients/`, so tests swap in a fake
client and a provider can change without touching the logic.

### Apps

| App       | Responsibility                                                                 | Key modules                                                                                                       |
| --------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `core`    | Health check, provider wiring, the error shape, a stdlib JSON-over-HTTP helper | `providers.py`, `http.py`, `api/exceptions.py`                                                                    |
| `risk`    | The PDF's threshold table and load rules; route scores, ranking, reasons       | `services/rules.py`, `services/scoring.py`, `types.py`                                                            |
| `weather` | Open-Meteo client, batched + cached forecasts, ETA lookup, corridor heatmap    | `clients/open_meteo.py`, `services/forecast.py`, `services/heatmap.py`                                            |
| `routing` | Place search, HERE truck routes, checkpoints with ETAs, naming, the plan       | `clients/here.py`, `clients/flexpolyline.py`, `services/planner.py`, `services/geometry.py`, `services/cities.py` |

The cross-app dependency direction is `routing → weather, risk`. `risk` depends on no other app.
None of the apps has models: all state is a short-lived cache entry.

### A plan request, end to end

```
POST /api/routes/plan/
  TripRequestSerializer            validate (camelCase), reject same place / past departure
  planner.plan_trip
    fetch_routes                   HERE truck routes (+ generated alternates if fewer than 3)
    RouteLine                      road miles + drive seconds at every vertex, from HERE's spans
    sample_checkpoints             every N miles: position, ETA = departure + drive time
    ForecastService.series         one batched, cached Open-Meteo request for every checkpoint
    reading_at → rules.classify    the hour nearest each ETA → level, deciding condition, load rule
    scoring.rank_routes / reasons  No Travel → Severe → High miles → average → time
  remember_corridor                the heatmap for this plan fetches only cells along its routes
  presenters.plan_json             domain dataclasses → contract JSON
```

### Providers

`apps/core/providers.py` hands views their clients. `SKYRIG_PROVIDERS=live` (the default) uses
HERE and Open-Meteo. `fake` uses deterministic offline stand-ins (`clients/fake.py` in `routing`
and `weather`): curved routes at truck speeds, and a fixed field of storms across the US. Pytest
always uses the fakes (`config.settings.test`), and so does `pnpm test:e2e:django`.

### Data

`apps/routing/data/us_cities.json` holds US places with 2,500+ people from GeoNames
`cities1000` (CC BY 4.0). Each row is `[name, state, lng, lat, population, timeZone]`. It powers
offline town search, "near Salina, KS" labels, the "via" names and each checkpoint's time zone.
Rebuild it with `scripts/build_us_cities.py` (usage is in the file).

### Caching

The default cache is local memory; set `CACHE_URL` (e.g. Redis) in production.

- **Forecast series:** cached per point, start hour and length for 30 minutes.
- **Finished heatmaps:** cached per area, hours, load band and hour, also for 30 minutes.
- **Plan corridors:** remembered for an hour, for the heatmap request that follows a plan.

## URLs

Each app exposes `api/urls.py` with an `app_name`, and `config/urls.py` includes it under `/api/`:

```python
# config/urls.py
path("api/", include("apps.core.api.urls")),
path("api/", include("apps.routing.api.urls")),  # geocode/, routes/plan/
path("api/", include("apps.weather.api.urls")),  # weather/heatmap/
```

Use trailing slashes (Django default) and refer to URLs by name in tests:
`reverse("core:health")`.

## Naming conventions (PEP 8)

| Thing                      | Convention                                             | Example                                  |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Packages, modules, folders | **snake_case**                                         | `route_planner.py`, `apps/risk/`         |
| Classes                    | PascalCase                                             | `RoutePlanSerializer`, `OpenMeteoClient` |
| Functions, variables       | snake_case                                             | `classify_checkpoint()`                  |
| Constants                  | UPPER_SNAKE_CASE                                       | `WIND_THRESHOLDS_MPH`                    |
| Views                      | PascalCase + `View`                                    | `PlanRoutesView`                         |
| Tests                      | `tests/test_<module>.py`, functions `test_<behaviour>` | `test_wind_55_is_no_travel`              |

Other conventions:

- **Type hints everywhere.** Pass `@dataclass(frozen=True)` objects between services, not raw
  dicts.
- **Settings come from the environment** through `config.settings.base`. Never hard-code secrets
  or API keys.
- **Tests use pytest.** Write plain `assert` functions, not `unittest.TestCase`, and add
  `@pytest.mark.django_db` only when a test touches the database.
- **One `tests/` package per app** (this differs from the frontend's per-folder `tests/` on
  purpose). It's the standard Django layout. Name test files after the module they cover
  (`services/risk_rules.py` → `tests/test_risk_rules.py`, `api/views.py` → `tests/test_api.py`).
  If an app's tests outgrow one folder, mirror the layers inside it (`tests/services/`,
  `tests/api/`) instead of scattering `tests/` folders through the app.
- **Ruff is the linter and formatter.** Line length is 100, and imports are sorted by Ruff.
