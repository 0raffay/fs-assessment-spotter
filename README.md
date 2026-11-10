# Spotter — Weather-Aware Truck Routing

A web app that helps a truck driver pick the safest route between two places. It weighs
**weather along the route** (forecast for when the truck actually gets there), **load weight**
and **travel time**, then recommends one of three route options and shows everything on a map
with a 0–48 h weather heatmap.

> **Status:** project scaffold only. The monorepo, React app and Django API are set up and talk
> to each other through a `/api/health/` endpoint. Routing, weather and risk features come next.

## Tech stack

| Area     | Choice                                                                           |
| -------- | -------------------------------------------------------------------------------- |
| Monorepo | pnpm workspaces, root scripts run both apps (`concurrently`)                     |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, axios, React Router |
| Backend  | Django 5.2 LTS, Django REST Framework, django-environ                            |
| Python   | Python 3.11, managed with [uv](https://docs.astral.sh/uv/)                       |
| Quality  | Frontend: oxlint, Prettier, Vitest. Backend: Ruff, pytest                        |

## Quick start

Prerequisites: **Node 22+**, **pnpm 10+**, **Python 3.11+**, **uv**. See
[docs/setup.md](docs/setup.md) for installing them and for troubleshooting.

```bash
pnpm setup          # install JS deps + create the Python venv with uv
pnpm api:migrate    # create the local SQLite database
pnpm dev            # web on http://localhost:5173, API on http://127.0.0.1:8000
```

Open http://localhost:5173. The page should show **API status: ok**.

## Scripts (run from the repo root)

| Script             | What it does                                           |
| ------------------ | ------------------------------------------------------ |
| `pnpm setup`       | Install frontend deps and sync the backend venv        |
| `pnpm dev`         | Run the web and API dev servers together               |
| `pnpm build`       | Type-check and build the frontend into `apps/web/dist` |
| `pnpm lint`        | oxlint + Prettier check (web), Ruff (api)              |
| `pnpm format`      | Auto-format both apps                                  |
| `pnpm test`        | Vitest (web) + pytest (api)                            |
| `pnpm web:dev`     | Frontend dev server only                               |
| `pnpm api:dev`     | Django dev server only                                 |
| `pnpm api:migrate` | Apply Django migrations                                |

## Documentation

- [docs/setup.md](docs/setup.md): installing, configuring and running locally
- [docs/folder-structure.md](docs/folder-structure.md): repo overview and naming at a glance
- [docs/frontend-structure.md](docs/frontend-structure.md): feature folders, api layer, `ROUTES`
- [docs/backend-structure.md](docs/backend-structure.md): Django apps, api/services/clients layers

## Repository layout (short)

```
apps/
  web/    React + Vite frontend
  api/    Django REST API
docs/     Project documentation
```
