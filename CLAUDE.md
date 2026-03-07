# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Python MCP server for tracking gym workouts, built with FastMCP and SQLite. The server exposes tools that allow AI assistants to log workouts, exercises, sets, and query training history.

## Commands

This project uses `uv` for package management.

```bash
# Install dependencies
uv sync

# Run the MCP server (local only)
uv run main.py

# Run with ngrok HTTPS tunnel (for claude.ai)
export NGROK_AUTHTOKEN=<token>
./start.sh

# Seed the database with muscle groups and exercises
uv run seed.py

# Add a dependency
uv add <package>
```

Python version: 3.12 (enforced via `.python-version`). No tests or linters are configured.

Environment variables: `MCP_HOST` (default `127.0.0.1`), `MCP_PORT` (default `8000`), `NGROK_AUTHTOKEN` (required by `start.sh`).

## Architecture

### Layers

```
main.py  (FastMCP tool definitions, @mcp.tool decorators)
    └── services/  (one service class per model, receives a Session)
            └── database.py  (SQLModel models + SQLite engine + init_db)
```

`main.py` opens a short-lived `with Session(engine) as session:` block per tool call, instantiates the needed service(s), calls the method, then returns a plain `dict` or `list[dict]`. FastMCP handles serialisation and HTTP transport.

The server runs the `streamable-http` transport — the MCP endpoint is `/mcp` (e.g. `http://127.0.0.1:8000/mcp`).

### Database Schema

Five SQLModel tables with cascade deletes throughout the hierarchy:

```
muscle_groups → exercises → workout_exercises → workout_exercises_details
                                  ↑
                             workouts ──────────┘
```

- `muscle_groups(id, name, vn_name)`
- `exercises(id, name, vn_name, muscle_group_id)`
- `workouts(id, date)` — `date` is an ISO 8601 string; one workout per day enforced in `WorkoutService.get_or_create`
- `workout_exercises(id, workout_id, exercise_id)` — join table; no update method
- `workout_exercises_details(id, workout_exercise_id, rep_count, weight)` — one row per set; `weight` is in kg

`init_db()` in `database.py` calls `SQLModel.metadata.create_all(engine)` and is called at module import time in `main.py`.

### Key Design Points

- Sets (reps + weight) are stored on `workout_exercises_details`, not on `workout_exercises`.
- `get_workout_detail` is the most complex tool — it chains four services in one session to build a nested response.
- All date operations use Vietnam timezone (UTC+7) via `VN_TZ` and `today_vn()` from `utils.py`. `WorkoutService.list_last_n_days` imports `VN_TZ` directly for date arithmetic.
- `vn_name` is a Vietnamese translation field present on both `MuscleGroup` and `Exercise`.

### services/ Pattern

Every service class accepts a `sqlmodel.Session` in `__init__` and uses `self.session` in all methods. `services/__init__.py` re-exports all five for a single import in `main.py`. `WorkoutService` has the most query methods: `get_or_create`, `list_last_n_days`, `list_in_date_range`, `list_in_month`.
