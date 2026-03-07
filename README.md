# Gym Tracker MCP Server

A Python MCP server for tracking gym workouts, built with FastMCP and SQLite. Exposes 14 tools for logging workouts, exercises, and sets.

## Requirements

- Python 3.12
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- [ngrok](https://ngrok.com/download) account (free tier works)

## Setup

```bash
# Install dependencies
cd backend && uv sync

# Seed the database with muscle groups and exercises
cd backend && uv run seed.py
```

## Running (local only)

```bash
cd backend && uv run main.py
# Server listens on http://127.0.0.1:8000
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

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MCP_HOST` | `127.0.0.1` | Host the server binds to |
| `MCP_PORT` | `8000` | Port the server listens on |
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
