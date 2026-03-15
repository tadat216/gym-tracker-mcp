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

Add: `tracking_type: TrackingType = Field(default=TrackingType.reps_weight)`

### `WorkoutExerciseDetail` model

```python
rep_count: Optional[int] = None      # was: int NOT NULL
weight: Optional[float] = None       # was: float NOT NULL
duration_sec: Optional[int] = None   # new
```

Null means "not applicable for this exercise type". `weight=0.0` is treated as null by the frontend and should not be stored.

### Alembic Migration

One migration using `batch_alter_table` (required for SQLite):

- `exercises`: add `tracking_type VARCHAR NOT NULL DEFAULT 'reps_weight'`
- `workout_exercises_details`: recreate table with `rep_count` and `weight` nullable, add `duration_sec INTEGER NULL`

All existing rows are preserved. Existing `rep_count` and `weight` values carry over unchanged.

**Downgrade path**: drop `duration_sec`, use `COALESCE(rep_count, 0)` and `COALESCE(weight, 0.0)` to backfill nulls before reinstating NOT NULL (use `server_default='0'` in `batch_alter_table` for SQLite compatibility), then drop `tracking_type` from `exercises`. Lossy for duration sets — accepted for emergency rollback only.

**seed.py**: explicitly deferred — existing exercises remain `reps_weight` until the user manually corrects them via the exercise library UI. Every fresh environment will have plank/wall-sit typed as `reps_weight` until fixed. This is an accepted known gap by user decision.

## Validation Rules

### Field combinations per `tracking_type`

| Type | `rep_count` | `weight` | `duration_sec` |
|------|-------------|----------|----------------|
| `reps_weight` | required | required | rejected |
| `bodyweight` | required | optional (>0 only) | rejected |
| `duration` | rejected | rejected | required |

"Rejected" = field must be absent or null; returns HTTP 422 if provided.
"Optional (>0 only)" = if sent as `0` or `null`, treat as null. Frontend must not submit `weight=0`.

### `SetCreate` validation flow (router-inlined)

1. Fetch `WorkoutExercise` row by `workout_exercise_id` using `session.get()` — return **HTTP 404** if not found. This row contains `exercise_id`.
2. Fetch `Exercise` row by `exercise_id` (from the row above) — return **HTTP 404** if not found. This row contains `tracking_type`.
3. Validate submitted fields against the table above — return **HTTP 422** with descriptive message on mismatch
4. Call `WorkoutExerciseDetailService.create()` with validated fields

Done inline in `log_set` using the existing `Session` dependency (same pattern as other routers).

### `SetUpdate` (PATCH)

No validation at all — partial update only. Fields not included in the request are unchanged. Clearing a field to `null` is not supported (the `if field is not None: set field` guard). Cross-type field writes (e.g., adding `rep_count` to a `duration` set) are silently accepted — out of scope for PATCH validation. Callers are responsible for sending only type-appropriate fields.

## Backend API Changes

### `database.py`

- Add `TrackingType` enum
- Update `Exercise` model: add `tracking_type`
- Update `WorkoutExerciseDetail` model: nullable fields + `duration_sec`

### `services/exercise.py`

- `create()`: add `tracking_type: TrackingType = TrackingType.reps_weight`
- `update()`: add `tracking_type: TrackingType | None = None`

### `routers/exercises.py`

- `ExerciseCreate`: add `tracking_type: TrackingType = TrackingType.reps_weight`
- `ExerciseUpdate`: add `tracking_type: TrackingType | None = None`
- `_fmt()`: add `"tracking_type": e.tracking_type`

### `services/workout_exercise_detail.py`

- `create()` signature: `(workout_exercise_id, rep_count=None, weight=None, duration_sec=None)`
- `update()`: add `duration_sec: int | None = None`
- PATCH guard preserved: `if field is not None: set field` — null cannot clear a stored value

### `routers/sets.py`

Add a named `SetResponse` Pydantic model (required so FastAPI registers it in the OpenAPI schema; orval will then generate a typed response instead of `unknown`):

```python
class SetResponse(BaseModel):
    id: int
    workout_exercise_id: int
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None
```

- `SetCreate`: fields optional; add `duration_sec`; add inline validation (see above)
- `SetUpdate`: add `duration_sec: int | None = None`
- Both `log_set` and `update_set`: `response_model=SetResponse, response_model_exclude_none=True`
- Remove `_fmt()` helper; return `SetResponse(**detail.model_dump())` or equivalent

### `routers/workouts.py` — workout detail endpoint

The `get_workout_detail` handler already calls `ExerciseService(session).get(we.exercise_id)` for each workout exercise, so the full `Exercise` object (including `tracking_type`) is already available. No new joins needed.

Exercise dict — add `tracking_type` from the already-fetched `exercise` object:
```python
{
    "workout_exercise_id": we.id,
    "exercise_id": we.exercise_id,
    "name": exercise.name if exercise else None,
    "vn_name": exercise.vn_name if exercise else None,
    "tracking_type": exercise.tracking_type if exercise else None,  # new
    "sets": [...]
}
```

Set dict — add `duration_sec`:
```python
{"id": s.id, "rep_count": s.rep_count, "weight": s.weight, "duration_sec": s.duration_sec}
```

### `services/workout.py`

`list_with_muscle_group_volume()`: fix volume formula to handle both null `weight` and null `rep_count` (duration sets):

```python
func.sum(func.coalesce(WorkoutExerciseDetail.rep_count, 0) * func.coalesce(WorkoutExerciseDetail.weight, 0))
```

This ensures duration sets (rep_count=null, weight=null) and pure bodyweight sets (weight=null) contribute 0.

## MCP Tools Layer

### `tools/exercises.py`

- `create_exercise` tool: add `tracking_type: str = "reps_weight"` parameter; pass to service; include in return dict
- `list_exercises` tool: add `"tracking_type": e.tracking_type` to each returned dict
Note: `PATCH /api/exercises/{id}` already exists in `routers/exercises.py` — the frontend edit flow has a working REST endpoint to call.

- **Create new** `update_exercise` MCP tool (does not currently exist in `tools/exercises.py`):
  ```
  update_exercise(exercise_id: int, name: str | None = None, vn_name: str | None = None,
                  muscle_group_id: int | None = None, tracking_type: str | None = None)
  ```
  Calls `ExerciseService.update()`. Returns updated exercise dict including `tracking_type`. Returns error message if exercise not found.

### `tools/sets.py`

- `log_set` tool: make `rep_count` and `weight` optional (default `None`); add `duration_sec: int | None = None`; pass to service; include `duration_sec` in return dict
- `update_set` tool: remove hard requirement for both `rep_count` and `weight`; add `duration_sec: int | None = None`; include `duration_sec` in return dict

### `tools/workouts.py` — workout detail tool

The MCP `get_workout_detail` tool builds the same inline dicts as the REST router. Apply identical changes:
- Include `tracking_type` in exercise dicts
- Include `duration_sec` in set dicts

## Frontend Changes

### Step 0: Regenerate API types

Run `npm run generate` after all backend changes. Orval produces:
- `TrackingType` union type from the `exercises` schema
- `SetResponse` typed response for set endpoints (instead of `unknown`) because `SetResponse` is registered as a named schema

### `workout-log-detail/types.ts`

Update both interfaces:

```typescript
import type { TrackingType } from '@/api/...'  // exact path from generated output

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
  tracking_type: TrackingType   // new
  sets: SetData[]
}

// Also update the Exercise interface used for the add-exercise dropdown:
export interface Exercise {
  id: number
  name: string
  vn_name: string
  muscle_group_id: number
  tracking_type: TrackingType   // new — needed so add-set form knows which inputs to show
}
```

### `hooks/useWorkoutLogDetail.ts`

The hook manages form state for adding sets. Changes required:

- Add `durationSec` string state alongside `repCount` and `weight`
- Add `onDurationSecChange` handler
- Update `handleSubmitSet` to conditionally submit based on `tracking_type` of the selected exercise:
  - `reps_weight` / `bodyweight`: submit `rep_count` + optional `weight`
  - `duration`: submit `duration_sec` only
- Expose `durationSec` and `onDurationSecChange` from the hook return value

### `SetRow` component

Receives `tracking_type: TrackingType` as a prop from `ExerciseItem`.

**Display (read mode)**:

| Type | Display |
|------|---------|
| `reps_weight` | `{weight}kg × {rep_count} reps` |
| `bodyweight` | `{rep_count} reps` (+ `+{weight}kg` only if `weight > 0`) |
| `duration` | `{duration_sec}s` if < 60, else `{floor(s/60)}m {s%60}s` |

**Edit form**: mirrors the same fields per type. Edit state adds `editDurationSec`.

### `ExerciseItem` component

Receives `tracking_type` from `ExerciseData`. Passes it to each `SetRow`.

**Add set form inputs per type**:

| Type | Inputs |
|------|--------|
| `reps_weight` | Weight (kg) required + Reps required |
| `bodyweight` | Reps required + Weight (kg) optional (do not submit if 0 or empty) |
| `duration` | Duration (seconds) required |

**Progress summary** (replaces "Volume" label):

| Type | Calculation | Display |
|------|-------------|---------|
| `reps_weight` | `Σ(rep_count × weight)` | `X kg` |
| `bodyweight` | total reps + optional added volume | `X reps [+ Y kg if any weight > 0]` |
| `duration` | `Σ(duration_sec)` formatted | `Xm Ys` |

### Exercise library — affected files

- **`exercise-library/types.ts`** (or orval-generated): add `tracking_type: TrackingType` to `Exercise` interface
- **`muscle-group-accordion/exercise-row/types.ts`**: add `tracking_type` to row props and edit view props
- **`muscle-group-accordion/exercise-row/views/edit.tsx`**: add `tracking_type` select field (options: Weighted / Bodyweight / Duration)
- **`muscle-group-accordion/exercise-row/hooks/useExerciseRow.tsx`**: add `tracking_type` to local edit state; include in `updateMutation.mutate()` call
- **`useMuscleGroupAccordion` hook**: add `trackingType` state (default `"reps_weight"`); show as select in the inline create form; include in `createExerciseMutation.mutate()` call

## Data Safety

- No existing set data is deleted or overwritten
- Existing `rep_count` and `weight` values are preserved after migration
- All existing `reps_weight` exercises continue to work without changes
- `tracking_type` defaults to `reps_weight` — new exercises behave as before unless changed
- Downgrade is lossy for duration sets (accepted, emergency use only)
- Frontend does not submit `weight=0` — zero weight is treated as null at the input level
