# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Python MCP server for tracking gym workouts, built with FastMCP and SQLite. The server exposes tools that allow AI assistants to log workouts, exercises, sets, and query training history.

## Commands

This project uses `uv` for package management.

```bash
# Install dependencies
uv sync

# Run the MCP server
uv run main.py

# Add a dependency
uv add <package>
```

Python version: 3.12 (enforced via `.python-version`).

## Architecture

### MCP Server

The entry point is `main.py`. All MCP tools are defined using FastMCP (`fastmcp>=3.1.0`). SQLite is used via the standard library (`sqlite3`) — no ORM.

### Database Schema

Five tables with cascade deletes throughout the hierarchy:

```
muscle_groups → exercises → workout_exercises → workout_exercises_details
                                ↑
                           workouts ──────────────┘
```

- `muscle_groups(id, name, color_hex)` — e.g. "Chest", "#FF0000"
- `exercises(id, name, muscle_group_id)` — exercises belong to one muscle group
- `workouts(id, date)` — a workout session on a given date
- `workout_exercises(id, workout_id, exercise_id)` — which exercises were done in a workout
- `workout_exercises_details(id, workout_exercise_id, rep_count, weight)` — individual sets (reps + weight) per exercise per workout

### Key Design Points

- A workout contains multiple exercises; each exercise can have multiple sets (details).
- `workout_exercises` is the join table between `workouts` and `exercises`; sets are recorded on `workout_exercises_details`, not directly on `workout_exercises`.
- Deleting a `workout` cascades to its `workout_exercises` and their `workout_exercises_details`. Same cascade applies down from `muscle_groups` through `exercises`.
