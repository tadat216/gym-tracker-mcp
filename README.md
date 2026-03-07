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

For local development without nginx:

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
- **Backend API:** http://localhost:8000/api/...
- **API Docs:** http://localhost:8000/api/docs

## Quick Start with ngrok (for claude.ai)

The fastest way to get your MCP server accessible to claude.ai:

```bash
export NGROK_AUTHTOKEN=<your-token>
./backend/start.sh
```

This starts the backend on port 8000 with an ngrok tunnel. Connect in claude.ai with the printed URL.

> **Note:** This runs backend only (no frontend). For full-stack deployment, see Production section below.

## Production Deployment (nginx + ngrok)

For production, use nginx to serve the frontend and proxy backend requests. This is the recommended setup.

### Prerequisites

- nginx installed (`sudo apt install nginx`)
- Node.js installed (for building frontend)
- ngrok authtoken (for public access)

### Step 1: Build Frontend

```bash
cd frontend && npm install && npm run build
```

This creates optimized static files in `frontend/dist/`.

### Step 2: Start Backend on Port 8001

```bash
cd backend && API_PORT=8001 nohup uv run python api.py > /tmp/backend.log 2>&1 &
```

The backend runs on port 8001 (internal only, not exposed to internet).

### Step 3: Start nginx on Port 8000

```bash
nginx -c /home/dev/gym-tracker-mcp/nginx.conf -g 'daemon off;'
```

nginx listens on port 8000 and:
- Serves React frontend from `frontend/dist/`
- Proxies `/api/*` to backend (port 8001)
- Proxies `/mcp` to backend (port 8001)

### Step 4: Expose with ngrok

```bash
export PATH="$HOME/.local/bin:$PATH"
ngrok config add-authtoken "<your-token>"
ngrok http 8000
```

Your app is now accessible at the ngrok URL (e.g., `https://xxxx.ngrok-free.dev`).

### Architecture

```
Internet (HTTPS via ngrok)
    ↓
  ngrok tunnel
    ↓
  nginx (port 8000)
    ├─ /api/*       → FastAPI (port 8001)
    ├─ /mcp         → FastAPI (port 8001)
    ├─ /api/docs    → FastAPI Swagger UI
    └─ /*           → React frontend (static files)
```

### Public URLs

Once deployed, your endpoints are:
- **Frontend:** `https://xxxx.ngrok-free.dev/`
- **REST API:** `https://xxxx.ngrok-free.dev/api/...`
- **MCP Server:** `https://xxxx.ngrok-free.dev/mcp`
- **API Docs:** `https://xxxx.ngrok-free.dev/api/docs`

### Managing Processes

All three services (backend, nginx, ngrok) should run simultaneously. Use tmux to manage them:

```bash
# Start tmux session
tmux new -s gym-tracker

# Pane 1: Backend
cd backend && API_PORT=8001 uv run python api.py

# Split window (Ctrl+b, then ")
# Pane 2: nginx
nginx -c /home/dev/gym-tracker-mcp/nginx.conf -g 'daemon off;'

# Split again
# Pane 3: ngrok
ngrok http 8000
```

To detach from tmux: `Ctrl+b`, then `d`  
To reattach: `tmux attach -t gym-tracker`

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
