# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Python backend for tracking gym workouts with two interfaces on a single port:
- **MCP server** (FastMCP, `streamable-http`) — for AI assistants via claude.ai
- **REST API** (FastAPI) — for the React frontend

Both share the same SQLite database through the same five service classes.

## Commands

All Python commands run from the `backend/` directory. This project uses `uv` for package management.

```bash
# Install dependencies
cd backend && uv sync

# Run the combined server (REST + MCP) on port 8000
cd backend && uv run python api.py

# Run the MCP-only server (no REST API)
cd backend && uv run main.py

# Run with ngrok HTTPS tunnel (exposes /mcp for claude.ai)
export NGROK_AUTHTOKEN=<token>
./backend/start.sh

# Seed the database with muscle groups and exercises
cd backend && uv run seed.py

# Add a dependency
cd backend && uv add <package>
```

Python version: 3.12 (enforced via `backend/.python-version`). No tests or linters are configured.

Environment variables:
- `API_HOST` (default `127.0.0.1`), `API_PORT` (default `8000`) — used by `api.py` and `start.sh`
- `MCP_HOST` (default `127.0.0.1`), `MCP_PORT` (default `8000`) — used by `main.py` only
- `NGROK_AUTHTOKEN` — required by `start.sh`

## Architecture

### Project Layout

```
backend/
├── api.py            ← combined entry point: FastAPI + FastMCP on one port
├── main.py           ← MCP-only entry point (no REST)
├── mcp_instance.py   ← creates the shared FastMCP instance, registers all tools
├── deps.py           ← FastAPI get_session() dependency
├── database.py       ← SQLModel models, SQLite engine, init_db()
├── utils.py          ← Vietnam timezone (VN_TZ, today_vn())
├── seed.py           ← idempotent DB seeder (8 muscle groups, ~40 exercises)
├── start.sh          ← starts api.py + ngrok tunnel
├── routers/          ← FastAPI APIRouter per resource (REST layer)
├── tools/            ← FastMCP tool definitions per resource (MCP layer)
└── services/         ← one service class per model (shared by both layers)
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

### Single-Port Design

`api.py` wires MCP into FastAPI by mounting the FastMCP ASGI app at `/mcp`:

```python
mcp_asgi = mcp.http_app(path="/", transport="streamable-http")
app = FastAPI(lifespan=mcp_asgi.lifespan)   # MCP lifespan forwarded to FastAPI
app.mount("/mcp", mcp_asgi)                  # path="/" means the sub-app's route is /
```

`path="/"` is required — without it the internal route is `/mcp` and mounting the sub-app at `/mcp` would make it unreachable. The MCP lifespan must be passed to `FastAPI(lifespan=...)` or the session manager's task group won't initialise.

All REST routes are under `/api/*`. The `/docs` Swagger UI and `/mcp` are siblings at the root — neither shadows the other because the mount is at `/mcp`, not `/`.

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
