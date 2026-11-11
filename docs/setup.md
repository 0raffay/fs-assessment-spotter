# Local setup

## 1. Prerequisites

| Tool   | Version | Install                                                                          |
| ------ | ------- | -------------------------------------------------------------------------------- |
| Node   | 22+     | https://nodejs.org (the repo has an `.nvmrc`)                                    |
| pnpm   | 10+     | `npm install -g pnpm` or `corepack enable`                                       |
| Python | 3.11+   | https://www.python.org/downloads/                                                |
| uv     | latest  | `pip install uv`, or see https://docs.astral.sh/uv/getting-started/installation/ |

Check they are on your `PATH`:

```bash
node -v && pnpm -v && python --version && uv --version
```

> **Windows:** `pip install --user uv` puts `uv.exe` in
> `%APPDATA%\Python\Python311\Scripts`. Add that folder to your `PATH` if `uv` is not found.

## 2. Install

From the repo root:

```bash
pnpm setup
```

This runs `pnpm install` for the frontend and `uv sync` in `apps/api`. That creates
`apps/api/.venv` with the exact versions from `uv.lock`, so there's no need to activate a
virtualenv: every backend script goes through `uv run`.

## 3. Environment variables

Both apps run with **no `.env` file** in development. Copy the examples only if you need to
override something:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**Backend (`apps/api/.env`)**

| Variable               | Default (dev)                   | Purpose                                                                                                                                 |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `DJANGO_SECRET_KEY`    | insecure dev key                | Required in production                                                                                                                  |
| `DJANGO_DEBUG`         | `true`                          | Debug mode                                                                                                                              |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1`           | Comma-separated host names                                                                                                              |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173`         | Frontend origins allowed to call API                                                                                                    |
| `DATABASE_URL`         | SQLite at `apps/api/db.sqlite3` | e.g. `postgres://user:pass@host/db`                                                                                                     |
| `CACHE_URL`            | in-memory                       | e.g. `redis://localhost:6379/0`                                                                                                         |
| `CSRF_TRUSTED_ORIGINS` | none                            | Production only                                                                                                                         |
| `HERE_API_KEY`         | empty                           | HERE routing + geocoding key, from [platform.here.com](https://platform.here.com) (Access Manager → Apps → API Keys). Server-side only. |
| `SKYRIG_PROVIDERS`     | `live`                          | `fake` swaps HERE and Open-Meteo for offline stand-ins (no keys or network; used by tests and `pnpm test:e2e:django`)                   |

**Frontend (`apps/web/.env`)**

| Variable                | Default                 | Purpose                                                    |
| ----------------------- | ----------------------- | ---------------------------------------------------------- |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8000` | Where the dev server forwards `/api` requests              |
| `VITE_API_BASE_URL`     | `/api`                  | Production: full URL of the deployed API                   |
| `VITE_ENABLE_MOCKS`     | `true`                  | `true`: in-browser MSW mocks; `false`: the real Django API |

## 4. Run

```bash
pnpm api:migrate   # first time only
pnpm dev
```

- Web: http://localhost:5173
- API: http://127.0.0.1:8000/api/health/ (returns `{"status": "ok"}`)
- Django admin: http://127.0.0.1:8000/admin/ (create a user with
  `uv run --directory apps/api python manage.py createsuperuser`)

In development the browser only talks to Vite. Vite forwards every `/api/*` request to Django,
so the frontend and API share an origin and CORS is not involved.

## 5. Quality checks

```bash
pnpm lint     # oxlint + Prettier (web), Ruff lint + format check (api)
pnpm format   # auto-fix formatting in both apps
pnpm test     # Vitest (web) + pytest (api)
pnpm build    # type-check + production build of the web app
```

## Settings modules (backend)

| Module                 | Used by                          |
| ---------------------- | -------------------------------- |
| `config.settings.dev`  | `manage.py` (default)            |
| `config.settings.test` | pytest (set in `pyproject.toml`) |
| `config.settings.prod` | `wsgi.py` / `asgi.py` (gunicorn) |

Choose another one with `DJANGO_SETTINGS_MODULE`.

## Troubleshooting

- **Vite starts on 5174 instead of 5173:** another program is using port 5173. Either stop it,
  or add the new origin to `CORS_ALLOWED_ORIGINS`. The proxy works on any port.
- **`uv: command not found`:** see the Windows note above about `PATH`.
- **Django says "You don't have permission to access that port" on 8000:** another program
  (often Docker Desktop) holds the port. Run the API elsewhere, e.g.
  `python manage.py runserver 127.0.0.1:8010`, and set `VITE_API_PROXY_TARGET=http://127.0.0.1:8010`
  in `apps/web/.env`.
- **"Forecast unavailable … busy (free-tier limit)":** Open-Meteo's free tier allows ~600
  locations a minute. A long trip's plan and heatmap use a few hundred, so many plans in a row can
  hit it. Wait a minute and press Retry, or develop with `SKYRIG_PROVIDERS=fake`.
- **Frontend tests fail on startup with an `undici` error:** `jsdom` is pinned to v26 on
  purpose. Newer versions need Node ≥ 22.15.
