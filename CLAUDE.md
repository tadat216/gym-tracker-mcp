# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Python backend for tracking gym workouts with two interfaces on a single port:
- **MCP server** (FastMCP, `streamable-http`) — for AI assistants via claude.ai
- **REST API** (FastAPI) — for the React frontend

Both share the same SQLite database through the same five service classes.

## Commands

### Backend

All Python commands run from the `backend/` directory. This project uses `uv` for package management.

```bash
# Install dependencies
cd backend && uv sync

# Run the combined server (REST + MCP) on port 8000
cd backend && uv run python api.py

# Run the MCP-only server (no REST API)
cd backend && uv run main.py

# Seed the database with muscle groups and exercises
cd backend && uv run seed.py

# Add a dependency
cd backend && uv add <package>
```

Python version: 3.12 (enforced via `backend/.python-version`). No tests or linters are configured.

### Frontend

All frontend commands run from the `frontend/` directory. Uses `npm`.

```bash
# Install dependencies
cd frontend && npm install

# Dev server (port 5173, proxies /api and /mcp to backend:8000)
cd frontend && npm run dev

# Production build (output to frontend/dist/)
cd frontend && npm run build

# Regenerate API hooks from OpenAPI spec (backend must be running on 8000)
curl http://localhost:8000/api/openapi.json > frontend/openapi.json
cd frontend && npm run generate
```

**Production deployment:**
```bash
# Build frontend
cd frontend && npm run build

# Start backend on port 8001
cd backend && API_PORT=8001 uv run python api.py

# Start nginx on port 8000 (in another terminal)
nginx -c /home/dev/gym-tracker-mcp/nginx.conf -g 'daemon off;'

# Expose via ngrok (in another terminal)
ngrok http 8000
```

Environment variables:
- `API_HOST` (default `127.0.0.1`), `API_PORT` (default `8000`) — used by `api.py`
- `MCP_HOST` (default `127.0.0.1`), `MCP_PORT` (default `8000`) — used by `main.py` only

## Architecture

### Project Layout

```
gym-tracker-mcp/
├── backend/
│   ├── api.py            ← combined entry point: FastAPI + FastMCP on one port
│   ├── main.py           ← MCP-only entry point (no REST)
│   ├── mcp_instance.py   ← creates the shared FastMCP instance, registers all tools
│   ├── deps.py           ← FastAPI get_session() dependency
│   ├── database.py       ← SQLModel models, SQLite engine, init_db()
│   ├── utils.py          ← Vietnam timezone (VN_TZ, today_vn())
│   ├── seed.py           ← idempotent DB seeder (8 muscle groups, ~40 exercises)
│   ├── routers/          ← FastAPI APIRouter per resource (REST layer)
│   ├── tools/            ← FastMCP tool definitions per resource (MCP layer)
│   └── services/         ← one service class per model (shared by both layers)
├── frontend/
│   ├── src/
│   │   ├── api/          ← orval-generated hooks + types (gitignored, regenerate with npm run generate)
│   │   ├── lib/
│   │   │   └── axios-instance.ts  ← custom axios mutator for orval (hand-written, committed)
│   │   └── main.tsx      ← React entry point, QueryClientProvider wrapper
│   ├── openapi.json      ← committed OpenAPI spec snapshot (source for codegen)
│   └── orval.config.ts   ← orval codegen config (tags-split, react-query, axios)
├── nginx.conf            ← production: port 8000 → FastAPI:8001 + frontend/dist/
└── docs/plans/           ← design docs and implementation plans
```

### Layers

```
api.py  (FastAPI app + FastMCP mounted at /mcp)
   ├── routers/   (REST — /api/* routes, use Depends(get_session))
   ├── tools/     (MCP — register(mcp) pattern, open their own sessions)
   └── services/  (shared DB logic — one class per model, accepts Session)
            └── database.py  (SQLModel models + SQLite engine)
```

`main.py` bypasses the REST layer entirely — it imports `mcp` from `mcp_instance.py` and runs it standalone.

### Single-Port Design (Development)

In development mode, `api.py` serves everything on port 8000:

```python
mcp_asgi = mcp.http_app(path="/", transport="streamable-http")
app = FastAPI(
    lifespan=mcp_asgi.lifespan,
    docs_url="/api/docs",          # Swagger UI at /api/docs
    redoc_url="/api/redoc",         # ReDoc at /api/redoc
    openapi_url="/api/openapi.json" # OpenAPI spec at /api/openapi.json
)
app.mount("/mcp", mcp_asgi)
```

`path="/"` is required — without it the internal route is `/mcp` and mounting the sub-app at `/mcp` would make it unreachable. The MCP lifespan must be passed to `FastAPI(lifespan=...)` or the session manager's task group won't initialise.

All REST routes are under `/api/*`. Documentation is at `/api/docs` to avoid conflicts with frontend routing.

### Production Architecture (nginx)

In production, nginx serves on port 8000 and proxies to FastAPI on port 8001:

```
nginx (port 8000)
  ├─ /api/*       → proxy to FastAPI (port 8001)
  ├─ /mcp         → proxy to FastAPI (port 8001)
  ├─ /api/docs    → proxy to FastAPI Swagger UI
  ├─ /api/redoc   → proxy to FastAPI ReDoc
  └─ /*           → serve React frontend (frontend/dist/)
```

nginx configuration includes:
- User-writable pid and log files (`/tmp/nginx.pid`, `/tmp/nginx-*.log`)
- MIME types for proper asset serving
- Proxy headers for correct client IP forwarding
- SSE streaming support for MCP (`proxy_buffering off`, HTTP/1.1)

### tools/ Pattern

Each module exposes a `register(mcp: FastMCP)` function that defines and decorates `@mcp.tool()` functions as inner functions. `mcp_instance.py` calls all five in sequence. Tools open their own `with Session(engine) as session:` block per call — they do not use `deps.get_session`.

### routers/ Pattern

Each module exposes a `router = APIRouter()`. Routers get a `Session` via `Depends(get_session)` from `deps.py`. All five are included in `api.py` with the `/api/<resource>` prefix.

### Database Schema

Five SQLModel tables:

```
muscle_groups → exercises → workout_exercises → workout_exercises_details
                                  ↑
                             workouts ──────────┘
```

- `muscle_groups(id, name, vn_name)`
- `exercises(id, name, vn_name, muscle_group_id)`
- `workouts(id, date)` — `date` is ISO 8601 string; one per day enforced in `WorkoutService.get_or_create`
- `workout_exercises(id, workout_id, exercise_id)` — join table; no update method
- `workout_exercises_details(id, workout_exercise_id, rep_count, weight)` — one row per set; `weight` in kg

`init_db()` calls `SQLModel.metadata.create_all(engine)` and must be called before the first request. Both `api.py` and `main.py` call it at startup.

### Key Design Points

- Sets (reps + weight) live on `workout_exercises_details`, not on `workout_exercises`.
- `vn_name` is a Vietnamese translation field on both `MuscleGroup` and `Exercise`.
- All date logic uses Vietnam timezone (UTC+7) via `VN_TZ` and `today_vn()` from `utils.py`.
- The `get_workout_detail` endpoint/tool is the most complex path — it chains four services in a single session to build a nested `{workout, exercises: [{sets: [...]}]}` response.
- `WorkoutService` has the most query methods: `get_or_create`, `list_last_n_days`, `list_in_date_range`, `list_in_month`.
- `WorkoutExerciseService` has no `update` method (the join table has no mutable fields).
- The MCP `update_set` tool requires both `rep_count` and `weight`; the REST `PATCH /api/sets/{id}` accepts either field as optional.
