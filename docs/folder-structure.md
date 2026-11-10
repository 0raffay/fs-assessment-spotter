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

Each app has its own detailed guide:

- **[Frontend structure](frontend-structure.md):** feature folders, the
  service / keys / hooks api layer, `ROUTES`, kebab-case naming.
- **[Backend structure](backend-structure.md):** one Django app per domain, with api / services /
  clients layers, settings modules and PEP 8 naming.

## Naming at a glance

|         | Frontend (`apps/web`)                            | Backend (`apps/api`)           |
| ------- | ------------------------------------------------ | ------------------------------ |
| Files   | kebab-case: `route-planner.service.ts`           | snake_case: `route_planner.py` |
| Folders | kebab-case: `route-planner/`                     | snake_case: `apps/routing/`    |
| Tests   | `tests/` in the tested folder: `tests/x.test.ts` | `tests/test_x.py` in each app  |
