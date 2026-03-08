# Gym Tracker MCP Server

A gym workout tracker with two interfaces — an MCP server for AI assistants (claude.ai) and a REST API for a React frontend. Built with FastMCP, FastAPI, and SQLite.

## Requirements

- Python 3.12 + [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 18+
- [ngrok](https://ngrok.com/download) account (free tier, for claude.ai access)

## Setup

### 1. Backend

```bash
cd backend && uv sync
cp backend/.env.example backend/.env   # then fill in real values
cd backend && uv run seed.py           # seed muscle groups and exercises
```

Edit `backend/.env`:

```
MCP_CLIENT_ID=gym-tracker-mcp
MCP_CLIENT_SECRET=<python -c "import secrets; print(secrets.token_hex(32))">
MCP_BASE_URL=http://127.0.0.1:8000/mcp   # change to public URL in production
AUTH_USERNAME=admin
AUTH_PASSWORD=<your password>
JWT_SECRET=<python -c "import secrets; print(secrets.token_hex(32))">
```

### 2. Frontend

```bash
cd frontend && npm install
```

## Development

```bash
# Terminal 1 — backend (REST API + MCP) on port 8000
cd backend && uv run python api.py

# Terminal 2 — frontend dev server on port 5173
cd frontend && npm run dev
# Open http://localhost:5173
# /api/* and /mcp are proxied to the backend automatically
```

Access:
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/api/docs

## Authentication

The app uses two separate auth systems backed by the same credentials in `backend/.env`:

**React frontend** — logs in at `/login` with a username/password form, gets a JWT (24h), stored in `localStorage`. All API calls include it as `Authorization: Bearer`.

**claude.ai MCP** — uses OAuth 2.1. When connecting in claude.ai:
1. Enter the MCP URL (e.g. `https://your-server/mcp`)
2. Enter `MCP_CLIENT_ID` and `MCP_CLIENT_SECRET` from your `.env`
3. claude.ai will open a browser login form — enter your `AUTH_USERNAME`/`AUTH_PASSWORD`
4. MCP tools are now available

> **Note:** MCP tokens are stored in memory and cleared on server restart. After a restart, re-authenticate in claude.ai by reconnecting the MCP server.

## Production Deployment (nginx + ngrok)

### Step 1: Configure `.env`

Set `MCP_BASE_URL` to your public URL:
```
MCP_BASE_URL=https://xxxx.ngrok-free.dev/mcp
```

### Step 2: Build and deploy

```bash
# Build frontend
cd frontend && npm run build

# Start backend on port 8001 (internal)
cd backend && API_PORT=8001 nohup uv run python api.py > /tmp/backend.log 2>&1 &

# Start nginx on port 8000
nginx -c /home/dev/gym-tracker-mcp/nginx.conf -g 'daemon off;'

# Expose via ngrok
ngrok http 8000
```

### Architecture

```
Internet (HTTPS via ngrok)
    ↓
  nginx (port 8000)
    ├─ /api/*  → FastAPI (port 8001)
    ├─ /mcp    → FastAPI (port 8001)
    └─ /*      → React frontend (frontend/dist/)
```

Use tmux to manage all three processes simultaneously:
```bash
tmux new -s gym-tracker
# Pane 1: backend, Pane 2: nginx, Pane 3: ngrok
# Ctrl+b d to detach, tmux attach -t gym-tracker to reattach
```

## Regenerating API hooks

When the backend API changes:

```bash
cd backend && uv run python api.py   # must be running
curl http://localhost:8000/api/openapi.json > frontend/openapi.json
cd frontend && npm run generate
git add frontend/openapi.json frontend/src/api/
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `API_HOST` | `127.0.0.1` | Host for `api.py` |
| `API_PORT` | `8000` | Port for `api.py` |
| `MCP_CLIENT_ID` | — | OAuth client ID (shown to claude.ai) |
| `MCP_CLIENT_SECRET` | — | OAuth client secret (shown to claude.ai) |
| `MCP_BASE_URL` | `http://127.0.0.1:8000/mcp` | Public MCP URL (must match deployment) |
| `AUTH_USERNAME` | — | Login username for both web and MCP |
| `AUTH_PASSWORD` | — | Login password for both web and MCP |
| `JWT_SECRET` | — | Secret for signing REST API JWTs |

## Available MCP Tools

| Tool | Description |
|---|---|
| `get_current_date` | Returns today's date (Vietnam timezone) |
| `get_calendar` | Monthly calendar with workout dates highlighted |
| `list_muscle_groups` | List all muscle groups |
| `list_exercises` | List exercises, optionally filtered by muscle group |
| `create_muscle_group` | Add a new muscle group |
| `create_exercise` | Add a new exercise |
| `list_workouts` | List workouts from the last N days |
| `list_workouts_in_range` | List workouts between two dates |
| `get_workout_detail` | Full workout detail with exercises and sets |
| `create_workout` | Create/get today's workout |
| `add_exercise_to_workout` | Add an exercise to a workout |
| `log_set` | Log a set (reps + weight in kg) |
| `update_set` | Update a set |
| `delete_set` | Delete a set |
