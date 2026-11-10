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

### Planned apps

| App       | Responsibility                                                            |
| --------- | ------------------------------------------------------------------------- |
| `core`    | Shared pieces: health check, common utilities                             |
| `routing` | Geocoding, route options, checkpoints with ETAs, `POST /api/routes/plan/` |
| `weather` | Forecast client, caching, corridor heatmap grid                           |
| `risk`    | Threshold + load rules, route scoring and recommendation                  |

The cross-app dependency direction is `routing → weather, risk`. `risk` depends on no other app.

## URLs

Each app exposes `api/urls.py` with an `app_name`, and `config/urls.py` includes it under `/api/`:

```python
# config/urls.py
path("api/", include("apps.core.api.urls")),
path("api/routes/", include("apps.routing.api.urls")),
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
