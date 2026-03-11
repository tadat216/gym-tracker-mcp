# Exercise Tracking Types Design

**Date:** 2026-03-12
**Branch:** enhance-exercise-workout-logging
**Status:** Approved

## Problem

The current schema forces every set to store `rep_count` (INT NOT NULL) and `weight` (FLOAT NOT NULL). This does not model three real exercise categories:

- **Weighted** (bench press, squat): reps + weight — currently supported
- **Bodyweight** (push-up, pull-up): reps only, with optional added weight
- **Duration** (plank, wall sit): seconds, no reps

## Approach

Approach B: fully nullable tracking fields on `WorkoutExerciseDetail`, plus a `TrackingType` enum on `Exercise`. Chosen over minimal nullable (A) for semantic clarity, and over separate tables (C) for simplicity.

## Database Schema Changes

### `TrackingType` enum (new, in `database.py`)

```python
class TrackingType(str, Enum):
    reps_weight = "reps_weight"
    bodyweight = "bodyweight"
    duration = "duration"
```

Using `str` Enum ensures FastAPI emits it as an OpenAPI `enum`, and orval generates a TypeScript union type — single source of truth.

### `Exercise` model

Add one field:

```python
tracking_type: TrackingType = Field(default=TrackingType.reps_weight)
```

Existing exercises default to `reps_weight` — no data change needed.

### `WorkoutExerciseDetail` model

```python
rep_count: Optional[int] = None      # was: int NOT NULL
weight: Optional[float] = None       # was: float NOT NULL
duration_sec: Optional[int] = None   # new
```

Null semantics: null means "not applicable for this exercise type", not zero.

### Alembic Migration

One new migration using `batch_alter_table` (required for SQLite column alterations):

- `exercises`: add `tracking_type VARCHAR NOT NULL DEFAULT 'reps_weight'`
- `workout_exercises_details`: recreate table with `rep_count` and `weight` nullable, add `duration_sec INTEGER NULL`

All existing rows are preserved. Existing `rep_count` and `weight` values carry over unchanged. No seed data updates required — existing exercises stay as `reps_weight` and can be updated manually.

## Backend API Changes

### `routers/exercises.py`

- `ExerciseCreate`: add `tracking_type: TrackingType = TrackingType.reps_weight`
- `ExerciseUpdate`: add `tracking_type: TrackingType | None = None`
- `_fmt()`: include `tracking_type` in response

### `routers/sets.py`

- `SetCreate`: `rep_count`, `weight` become optional; add `duration_sec: int | None = None`
- `SetUpdate`: add `duration_sec: int | None = None`
- Set endpoints use `response_model_exclude_none=True` — null fields stripped from response
- `_fmt()`: include `duration_sec`

### `services/workout_exercise_detail.py`

- `create()`: accept optional `rep_count`, `weight`, `duration_sec`
- `update()`: accept optional `duration_sec`

### `services/workout.py`

- `list_with_muscle_group_volume()`: guard against null `weight` — rows where `weight IS NULL` contribute 0 to volume. Existing weighted sets unaffected.

### Workout detail endpoint

The exercise objects in the workout detail response must include `tracking_type` so the frontend can render the correct fields per exercise.

## Frontend Changes

### API regeneration

Run `npm run generate` after backend changes to get updated orval types including:

```typescript
export type TrackingType = 'reps_weight' | 'bodyweight' | 'duration'
```

### `workout-log-detail/types.ts`

```typescript
import type { TrackingType } from '@/api/...'

export interface SetData {
  id: number
  rep_count?: number
  weight?: number
  duration_sec?: number
}

export interface ExerciseData {
  workout_exercise_id: number
  exercise_id: number
  name: string
  vn_name: string
  tracking_type: TrackingType
  sets: SetData[]
}
```

### `SetRow` component

Render fields based on `tracking_type` (passed from `ExerciseItem`):

| Type | Display |
|------|---------|
| `reps_weight` | `{weight}kg × {rep_count} reps` |
| `bodyweight` | `{rep_count} reps` (+ `+{weight}kg` if weight present) |
| `duration` | `{duration_sec}s` or `{m}m {s}s` |

### `ExerciseItem` component

**Add set form** — inputs shown per type:

| Type | Inputs |
|------|--------|
| `reps_weight` | Weight (kg) + Reps |
| `bodyweight` | Reps + optional Weight (kg) |
| `duration` | Duration (seconds) |

**Progress summary** (replaces "Volume" label):

| Type | Calculation | Display |
|------|-------------|---------|
| `reps_weight` | `Σ(rep_count × weight)` | `X kg` |
| `bodyweight` | `Σ(rep_count)` + optional `Σ(rep_count × weight)` | `X reps [+ Y kg]` |
| `duration` | `Σ(duration_sec)` | `Xm Ys` |

### Exercise library create/edit form

Add `tracking_type` select field with three options. Default: `reps_weight`.

## Data Safety

- No existing set data is deleted or overwritten
- `rep_count` and `weight` in existing rows retain their values after migration
- All existing `reps_weight` exercises continue to work without any manual changes
- The `tracking_type` default ensures all existing and new exercises behave as before unless explicitly changed
