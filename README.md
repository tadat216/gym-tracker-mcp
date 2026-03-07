# Gym Tracker MCP Server

A gym workout tracker with two interfaces — an MCP server for AI assistants (claude.ai) and a REST API for a React frontend. Built with FastMCP, FastAPI, and SQLite.

## Requirements

- Python 3.12 + [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 18+
- [ngrok](https://ngrok.com/download) account (free tier, for claude.ai access)

## Setup

```bash
# Backend
cd backend && uv sync
cd backend && uv run seed.py   # seed muscle groups and exercises

# Frontend
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

## Running (MCP only, local)

```bash
cd backend && uv run main.py
# MCP endpoint: http://127.0.0.1:8000/mcp
```

## Running with ngrok (for claude.ai)

ngrok provides an HTTPS tunnel so claude.ai can reach your local server.

### 1. Get your ngrok authtoken

1. Sign up or log in at <https://dashboard.ngrok.com>
2. Copy your authtoken from <https://dashboard.ngrok.com/get-started/your-authtoken>

### 2. Start the server

```bash
export NGROK_AUTHTOKEN=<your-token>
./backend/start.sh
```

The script will print your public MCP endpoint, e.g.:

```
======================================================
  Gym Tracker MCP Server is running!
======================================================

  MCP endpoint:  https://xxxx.ngrok-free.app/mcp

  To connect in claude.ai:
    1. Go to claude.ai → Settings → Integrations
    2. Add a new integration with URL:
       https://xxxx.ngrok-free.app/mcp

  ngrok inspector: http://127.0.0.1:4040
======================================================
```

### 3. Connect in claude.ai

1. Open [claude.ai](https://claude.ai) → **Settings** → **Integrations**
2. Click **Add integration**
3. Paste the `https://xxxx.ngrok-free.app/mcp` URL
4. Save — the Gym Tracker tools will now be available in your conversations

> **Note:** The ngrok URL changes each time you restart (free tier). Update the integration URL in claude.ai after each restart, or upgrade to a paid ngrok plan to use a static domain.

## Production (nginx)

nginx listens on port 8000, serves the React app as static files, and proxies API/MCP traffic to FastAPI on port 8001.

```bash
# Build frontend
cd frontend && npm run build

# Start FastAPI on internal port 8001
cd backend && API_PORT=8001 uv run python api.py &

# Start nginx
nginx -c /path/to/gym-tracker-mcp/nginx.conf
```

## Regenerating API hooks

When the backend API changes, re-export the OpenAPI spec and regenerate:

```bash
cd backend && uv run python api.py            # must be running
curl http://localhost:8000/openapi.json > frontend/openapi.json
cd frontend && npm run generate
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `API_HOST` | `127.0.0.1` | Host for `api.py` |
| `API_PORT` | `8000` | Port for `api.py` |
| `MCP_HOST` | `127.0.0.1` | Host for `main.py` (MCP-only) |
| `MCP_PORT` | `8000` | Port for `main.py` (MCP-only) |
| `NGROK_AUTHTOKEN` | — | Required for `start.sh` |

## Available Tools

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
