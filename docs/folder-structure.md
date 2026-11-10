# Folder structure

```
fs-assessment-spotter/
├── apps/
│   ├── web/                     React frontend (pnpm workspace package "web")
│   └── api/                     Django backend (uv project "spotter-api")
├── docs/                        Project documentation
├── package.json                 Root scripts that run both apps
├── pnpm-workspace.yaml          Lists the JS workspace packages
├── pnpm-lock.yaml
├── .editorconfig                Shared formatting basics (2 spaces, 4 for Python)
├── .gitattributes               Normalises line endings to LF
├── .gitignore
├── .nvmrc                       Node version
└── README.md
```

**Why a monorepo:** the frontend and API change together (the API response shape drives the
map UI), so one repo keeps them in one PR, one history and one set of root commands. pnpm
workspaces only cover the JavaScript side. The Python app is a separate uv project, and the root
scripts call it with `uv run --directory apps/api`.

## `apps/web` — React + Vite

```
apps/web/
├── index.html
├── vite.config.ts               Plugins, `@/` alias, /api dev proxy, Vitest config
├── tsconfig*.json               App and tooling TypeScript configs
├── .oxlintrc.json               Lint rules (oxlint)
├── .prettierrc.json             Formatting (with Tailwind class sorting)
├── .env.example
├── public/                      Static files served as-is
└── src/
    ├── main.tsx                 Entry: mounts <App/> inside the providers
    ├── index.css                Tailwind entry point
    ├── app/
    │   ├── App.tsx              Top-level layout
    │   └── providers.tsx        App-wide providers (TanStack Query client)
    ├── features/                One folder per feature (see below)
    ├── lib/
    │   └── api.ts               Typed fetch wrapper (apiGet / apiPost / ApiError)
    └── test/
        └── setup.ts             Vitest setup (jest-dom matchers)
```

Conventions:
- **Import with the `@/` alias** (`@/lib/api`) instead of long relative paths.
- **Organise by feature, not by file type.** Each folder in `src/features/` keeps its
  components, hooks, API calls and types together. Planned features:
  `route-planner/` (form and route cards), `map/` (routes and checkpoints), `heatmap/`
  (forecast grid and slider).
- `lib/` is for code shared across features with no UI.
- Put tests next to the code they test (`api.ts` → `api.test.ts`).

## `apps/api` — Django + DRF

```
apps/api/
├── manage.py                    Uses config.settings.dev by default
├── pyproject.toml               Dependencies, Ruff and pytest config
├── uv.lock                      Exact locked versions (commit it)
├── .python-version              3.11
├── .env.example
├── config/                      Project-level configuration (not an app)
│   ├── settings/
│   │   ├── base.py              Shared settings, read from the environment
│   │   ├── dev.py               Local defaults, browsable API
│   │   ├── test.py              In-memory DB for pytest
│   │   └── prod.py              Security hardening, logging
│   ├── urls.py                  Root URLs: /admin/, /api/
│   ├── wsgi.py / asgi.py        Server entry points (use prod settings)
└── apps/                        Django apps, imported as `apps.<name>`
    └── core/
        ├── apps.py
        ├── urls.py              /api/health/
        ├── views.py             HealthView
        ├── migrations/
        └── tests/
            └── test_health.py
```

Conventions:
- **`config/` is the project and `apps/` holds the Django apps.** This keeps settings separate
  from domain code. Register new apps as `"apps.<name>"` in `INSTALLED_APPS`.
- **One settings module per environment**, all built on `base.py`. Secrets come only from
  environment variables, via django-environ.
- **Keep views thin.** Domain logic (routing, weather sampling, risk scoring, recommendation)
  will live in plain-Python `services/` modules inside each app, so it can be unit-tested
  without HTTP.
- Tests live in each app's `tests/` package. pytest picks up `test_*.py` files.
- Each app has its own `urls.py`, included under `/api/` from `config/urls.py`.
