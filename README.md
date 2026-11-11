<p align="center">
  <img src="apps/web/public/logo.svg" alt="SkyRig — weather-aware truck routing" width="420" />
</p>

# SkyRig — Weather-Aware Truck Routing

A web app that helps a truck driver pick the safest route between two places. It weighs
**weather along the route** (forecast for when the truck actually gets there), **load weight**
and **travel time**, then recommends one of three route options and shows everything on a map
with a 0–48 h weather heatmap.

## How it works

1. **Places:** town names are searched offline in a bundled list of ~11,000 US places
   (GeoNames). ZIP codes and street addresses go to HERE Geocoding.
2. **Routes:** HERE Routing v8 in **truck mode** returns up to three routes. The load weight is
   sent as the truck's gross weight, so weight-restricted roads are avoided. If HERE returns
   fewer than three, SkyRig requests extra routes through a waypoint pushed to one side of the
   trip. These are kept only if they differ from the others and aren't far slower, and are marked
   "Generated".
3. **Checkpoints:** every 10, 25 or 50 miles, starting at mile 0.
   - Each checkpoint's **ETA** is the departure plus HERE's own drive time to that point. HERE
     reports time per road stretch (roughly every 4–5 miles), not one average speed.
   - Each checkpoint is labelled with its nearest town and that town's time zone.
4. **Weather:** Open-Meteo's hourly forecast at each checkpoint, for the hour nearest its ETA.
   - All checkpoints go in one batched, cached request.
   - ETAs past the 16-day forecast range are marked "no forecast" and count toward no risk level.
5. **Risk:** the PDF's threshold table, then the load rules, decide each checkpoint's level.
6. **Ranking:** routes are compared in this order, and the first rule that separates them becomes
   the reason shown:
   1. fewest **No Travel** miles;
   2. then **Severe** miles;
   3. then **High** miles;
   4. then the lowest **average risk** (mean 0–4 level over checkpoints with a forecast);
   5. then the shortest **drive time**.
7. **Heatmap:** a 0.5° grid of 0–48 h risk. Only cells within about 1° of the plan's routes are
   fetched, and the result is cached for 30 minutes.

### Risk rules

| Condition    | Low    | Moderate  | High      | Severe    | No Travel |
| ------------ | ------ | --------- | --------- | --------- | --------- |
| Wind (mph)   | < 25   | 25–34     | 35–44     | 45–54     | ≥ 55      |
| Rain (in/hr) | < 0.10 | 0.10–0.24 | 0.25–0.49 | 0.50–1.00 | > 1.00    |
| Snow (in/hr) | < 0.5  | 0.5–0.9   | 1.0–1.9   | 2.0–3.0   | > 3.0     |

Load rules (wind only):

- **45–54 mph with more than 30,000 lb** is **No Travel**.
- **35–44 mph with more than 40,000 lb** is at least **Severe**.

A checkpoint's level is the worst of the three conditions after the load rules. The UI shows which
condition decided it, and whether a load rule did.

### Assumptions (where the spec leaves room)

- A value on a band's lower bound belongs to that higher band. Wind's No Travel bound is
  inclusive (≥ 55), rain's and snow's are exclusive (> 1.00, > 3.0), as the spec writes them.
- No Travel ranks before Severe.
- Wind is judged on the **sustained** 10 m wind speed. Gusts are fetched but don't set the level.
- Rain is Open-Meteo's `rain + showers` for the hour. Snow is `snowfall`, in inches.
- The load weight is sent to HERE as gross weight. No empty-truck weight is added.
- ETAs include no rest breaks (hours-of-service rules).
- The heatmap's hour 0 is the current hour.

### Services and data

| Need                   | Choice                                              | Notes                                                                                     |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Truck routes, geocode  | HERE Routing v8, Geocoding & Search v7              | Needs `HERE_API_KEY`; free tier                                                           |
| Weather                | Open-Meteo                                          | No key. Free tier: ~600 locations/minute, 10,000/day (each location counts as one call)   |
| Town names, time zones | GeoNames `cities1000` (CC BY 4.0)                   | US places with 2,500+ people, bundled; rebuild with `apps/api/scripts/build_us_cities.py` |
| Map tiles              | CARTO (Map, Terrain), USGS National Map (Satellite) | No keys                                                                                   |

With `SKYRIG_PROVIDERS=fake` the API swaps HERE and Open-Meteo for deterministic offline stand-ins.
That's for development without keys, and it's what the end-to-end tests use.

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

Open http://localhost:5173. Without a `HERE_API_KEY`, run the API with `SKYRIG_PROVIDERS=fake`, or
set `VITE_ENABLE_MOCKS=true` in `apps/web/.env` to use the in-browser mocks.

## Scripts (run from the repo root)

| Script                 | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm setup`           | Install frontend deps and sync the backend venv             |
| `pnpm dev`             | Run the web and API dev servers together                    |
| `pnpm build`           | Type-check and build the frontend into `apps/web/dist`      |
| `pnpm lint`            | oxlint + Prettier check (web), Ruff (api)                   |
| `pnpm format`          | Auto-format both apps                                       |
| `pnpm test`            | Vitest (web) + pytest (api)                                 |
| `pnpm test:e2e`        | Playwright end-to-end suite (web, mocked API)               |
| `pnpm test:e2e:django` | The same suite against the real Django API (fake providers) |
| `pnpm web:dev`         | Frontend dev server only                                    |
| `pnpm api:dev`         | Django dev server only                                      |
| `pnpm api:migrate`     | Apply Django migrations                                     |

## Documentation

- [DESIGN.md](DESIGN.md): design system (colors, type, components), mapped to shadcn/ui tokens
- [docs/setup.md](docs/setup.md): installing, configuring and running locally
- [docs/folder-structure.md](docs/folder-structure.md): repo overview and naming at a glance
- [docs/frontend-structure.md](docs/frontend-structure.md): feature folders, api layer, `ROUTES`
- [docs/backend-structure.md](docs/backend-structure.md): Django apps, api/services/clients layers
- [docs/api-contract.md](docs/api-contract.md): the three endpoints, errors and codes

## Repository layout (short)

```
apps/
  web/    React + Vite frontend
  api/    Django REST API
docs/     Project documentation
```
