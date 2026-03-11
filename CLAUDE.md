# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Python backend for tracking gym workouts with two interfaces on a single port:
- **MCP server** (FastMCP, `streamable-http`) — for AI assistants via claude.ai, protected by OAuth 2.1
- **REST API** (FastAPI) — for the React frontend, protected by JWT Bearer tokens

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

# Database migrations (Alembic — run from backend/ directory)
cd backend && uv run alembic upgrade head          # apply all pending migrations
cd backend && uv run alembic revision --autogenerate -m "description"  # create new migration
cd backend && uv run alembic downgrade -1          # roll back one migration
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
- Auth vars (required — see `backend/.env.example`): `MCP_CLIENT_ID`, `MCP_CLIENT_SECRET`, `MCP_BASE_URL`, `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET`

## Architecture

### Project Layout

```
gym-tracker-mcp/
├── backend/
│   ├── api.py            ← combined entry point: creates FastMCP + FastAPI on one port, registers all tools
│   ├── main.py           ← MCP-only entry point (no REST)
│   ├── auth.py           ← GymTrackerOAuthProvider (MCP OAuth 2.1) + JWT helpers (REST)
│   ├── deps.py           ← FastAPI get_session() dependency
│   ├── database.py       ← SQLModel models + SQLite engine
│   ├── alembic/          ← Alembic migration environment (env.py imports SQLModel metadata)
│   ├── alembic.ini       ← Alembic config (points to sqlite:///./gym_tracker.db)
│   ├── utils.py          ← Vietnam timezone (VN_TZ, today_vn())
│   ├── seed.py           ← idempotent DB seeder (8 muscle groups, ~40 exercises)
│   ├── .env              ← secrets (gitignored); copy from .env.example
│   ├── routers/          ← FastAPI APIRouter per resource (REST layer)
│   ├── tools/            ← FastMCP tool definitions per resource (MCP layer)
│   └── services/         ← one service class per model (shared by both layers)
├── frontend/
│   ├── src/
│   │   ├── api/          ← orval-generated hooks + types (committed; regenerate with npm run generate)
│   │   ├── components/
│   │   │   └── auth/login-form/  ← login form (hooks/views/container pattern)
│   │   ├── contexts/
│   │   │   └── auth-context.tsx  ← JWT token state + TOKEN_KEY constant
│   │   ├── lib/
│   │   │   └── axios-instance.ts ← custom axios mutator; attaches JWT, redirects on 401
│   │   └── main.tsx      ← React entry: BrowserRouter + AuthProvider + ProtectedRoute
│   ├── openapi.json      ← committed OpenAPI spec snapshot (source for codegen)
│   └── orval.config.ts   ← orval codegen config (tags-split, react-query, axios)
├── nginx.conf            ← production: port 8000 → FastAPI:8001 + frontend/dist/
└── docs/plans/           ← design docs and implementation plans
```

### Layers

```
api.py  (FastAPI app + FastMCP mounted at /mcp)
   ├── auth.py    (GymTrackerOAuthProvider for MCP; require_auth dependency for REST)
   ├── routers/   (REST — /api/* routes, use Depends(get_session) + Depends(require_auth))
   ├── tools/     (MCP — register(mcp) pattern, open their own sessions; protected by OAuth)
   └── services/  (shared DB logic — one class per model, accepts Session)
            └── database.py  (SQLModel models + SQLite engine)
```

`main.py` bypasses the REST layer entirely — it creates its own `FastMCP` instance and runs it standalone.

### Authentication Architecture

Two independent auth systems share the same `AUTH_USERNAME`/`AUTH_PASSWORD` from `.env`:

**MCP OAuth 2.1** (`GymTrackerOAuthProvider` in `auth.py`):
- `api.py` passes the provider to `FastMCP(..., auth=...)`
- FastMCP serves `/.well-known/oauth-authorization-server`, `/mcp/authorize`, `/mcp/token`
- `api.py` serves the login form at `GET/POST /auth/login` (FastAPI routes, not MCP routes)
- Tokens are stored in memory — cleared on server restart, requiring re-auth in claude.ai
- `MCP_BASE_URL` must be set to the public URL in production (e.g. `https://your-domain.com/mcp`)

**REST JWT** (`create_jwt` / `require_auth` in `auth.py`):
- `POST /api/auth/login` exchanges credentials for a 24-hour JWT
- All `/api/*` routers include `Depends(require_auth)` as a router-level dependency
- Frontend stores the token in `localStorage` under `TOKEN_KEY` (defined in `auth-context.tsx`)
- `axios-instance.ts` attaches the token to every request and redirects to `/login` on 401

**Critical import order**: `api.py` calls `load_dotenv()` before any local imports because `auth.py` reads env vars at module level.

### Single-Port Design (Development)

In development mode, `api.py` serves everything on port 8000:

```python
mcp_asgi = mcp.http_app(path="/", transport="streamable-http")
app = FastAPI(lifespan=mcp_asgi.lifespan, ...)
app.mount("/mcp", mcp_asgi)
```

`path="/"` is required — without it the internal route is `/mcp` and mounting at `/mcp` would make it unreachable. The MCP lifespan must be passed to `FastAPI(lifespan=...)` or the session manager's task group won't initialise.

All REST routes are under `/api/*`. Documentation is at `/api/docs` to avoid conflicts with frontend routing.

### Production Architecture (nginx)

In production, nginx serves on port 8000 and proxies to FastAPI on port 8001:

```
nginx (port 8000)
  ├─ /api/*       → proxy to FastAPI (port 8001)
  ├─ /mcp         → proxy to FastAPI (port 8001)
  └─ /*           → serve React frontend (frontend/dist/)
```

nginx configuration includes SSE streaming support for MCP (`proxy_buffering off`, HTTP/1.1) and user-writable pid/log paths for non-root deployments.

### tools/ Pattern

Each module exposes a `register(mcp: FastMCP)` function that defines and decorates `@mcp.tool()` functions as inner functions. `api.py` calls all five `register()` functions in sequence. Tools open their own `with Session(engine) as session:` block per call — they do not use `deps.get_session`.

### routers/ Pattern

Each module exposes a `router = APIRouter()`. Routers get a `Session` via `Depends(get_session)` from `deps.py`. All five are included in `api.py` with the `/api/<resource>` prefix and a shared `Depends(require_auth)` dependency.

### Frontend Component Pattern

Components follow a strict `hooks → views → container` structure co-located per component:
```
component-name/
  types.ts       ← prop interfaces
  hooks.ts       ← data fetching + state logic
  views/
    main.tsx     ← pure presentational (one component per file)
    index.ts     ← barrel export
  container.tsx  ← composes hook + view; handles routing/auth guards
  index.ts       ← exports container only
```

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

Schema is managed by Alembic migrations. Run `uv run alembic upgrade head` before first use (or after pulling schema changes). The Alembic `env.py` uses `render_as_batch=True` to support SQLite ALTER TABLE operations.

### Key Design Points

- Sets (reps + weight) live on `workout_exercises_details`, not on `workout_exercises`.
- `vn_name` is a Vietnamese translation field on both `MuscleGroup` and `Exercise`.
- All date logic uses Vietnam timezone (UTC+7) via `VN_TZ` and `today_vn()` from `utils.py`.
- The `get_workout_detail` endpoint/tool is the most complex path — it chains four services in a single session to build a nested `{workout, exercises: [{sets: [...]}]}` response.
- `WorkoutService` has the most query methods: `get_or_create`, `list_last_n_days`, `list_in_date_range`, `list_in_month`.
- `WorkoutExerciseService` has no `update` method (the join table has no mutable fields).
- The MCP `update_set` tool requires both `rep_count` and `weight`; the REST `PATCH /api/sets/{id}` accepts either field as optional.
- `TOKEN_KEY` (`"gym_tracker_token"`) is defined and exported from `auth-context.tsx` — import it rather than hardcoding the string elsewhere.
- Never embed credentials in `VITE_*` env vars — they are inlined into the JS bundle at build time.
