# Exercise Tracking Types Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for three exercise tracking types (reps_weight, bodyweight, duration) across database, backend API, MCP tools, and frontend UI.

**Architecture:** Add `TrackingType` enum to `Exercise` model, make set fields nullable, add `duration_sec`. Validation is inline in `log_set` router. Frontend conditionally renders inputs/display based on `tracking_type`.

**Tech Stack:** Python/FastAPI/SQLModel/Alembic (backend), React/TypeScript/orval (frontend)

**Spec:** `docs/superpowers/specs/2026-03-12-exercise-tracking-types-design.md`

---

## Chunk 1: Backend Database & Services

### Task 1: Database Model Changes

**Files:**
- Modify: `backend/database.py:18-48`

- [ ] **Step 1: Add TrackingType enum and update models**

Add `TrackingType` enum before the `Exercise` class. Update `Exercise` to include `tracking_type`. Update `WorkoutExerciseDetail` to make `rep_count` and `weight` optional and add `duration_sec`.

```python
# Add import at top: from enum import Enum (already has SQLModel imports)

class TrackingType(str, Enum):
    reps_weight = "reps_weight"
    bodyweight = "bodyweight"
    duration = "duration"

# Exercise model - add field:
    tracking_type: TrackingType = Field(default=TrackingType.reps_weight)

# WorkoutExerciseDetail model - change fields:
    rep_count: int | None = Field(default=None)    # was: int
    weight: float | None = Field(default=None)     # was: float
    duration_sec: int | None = Field(default=None) # new
```

- [ ] **Step 2: Commit**

```bash
git add backend/database.py
git commit -m "feat: add TrackingType enum, update Exercise and WorkoutExerciseDetail models"
```

### Task 2: Alembic Migration

**Files:**
- Create: `backend/alembic/versions/<auto>_add_tracking_type_and_duration.py`

- [ ] **Step 1: Generate and edit migration**

```bash
cd backend && uv run alembic revision --autogenerate -m "add tracking type and duration fields"
```

Edit the generated migration to use `batch_alter_table` for SQLite compatibility:

**Upgrade:**
- `exercises`: add column `tracking_type VARCHAR NOT NULL DEFAULT 'reps_weight'`
- `workout_exercises_details`: recreate table via `batch_alter_table` — make `rep_count` nullable, make `weight` nullable, add `duration_sec INTEGER NULL`

**Downgrade:**
- Drop `duration_sec`, use `COALESCE` to backfill nulls, reinstate NOT NULL on `rep_count`/`weight`, drop `tracking_type`

- [ ] **Step 2: Run migration**

```bash
cd backend && uv run alembic upgrade head
```

- [ ] **Step 3: Verify migration applied**

```bash
cd backend && uv run alembic current
```

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/
git commit -m "feat: add Alembic migration for tracking type and duration fields"
```

### Task 3: Service Layer Changes

**Files:**
- Modify: `backend/services/exercise.py:10-45`
- Modify: `backend/services/workout_exercise_detail.py:10-46`
- Modify: `backend/services/workout.py:89`

- [ ] **Step 1: Update ExerciseService**

`create()` — add `tracking_type: TrackingType = TrackingType.reps_weight` parameter, set on model.
`update()` — add `tracking_type: TrackingType | None = None` parameter, apply with None-check.

Import `TrackingType` from `database`.

- [ ] **Step 2: Update WorkoutExerciseDetailService**

`create()` — change signature to `(workout_exercise_id, rep_count=None, weight=None, duration_sec=None)`. All three field params optional with `None` defaults.
`update()` — add `duration_sec: int | None = None` parameter, apply with None-check.

- [ ] **Step 3: Update WorkoutService volume calculation**

In `list_with_muscle_group_volume()`, change line 89 from:
```python
func.sum(WorkoutExerciseDetail.rep_count * WorkoutExerciseDetail.weight).label("volume")
```
to:
```python
func.sum(func.coalesce(WorkoutExerciseDetail.rep_count, 0) * func.coalesce(WorkoutExerciseDetail.weight, 0)).label("volume")
```

- [ ] **Step 4: Commit**

```bash
git add backend/services/
git commit -m "feat: update services for tracking type support"
```

## Chunk 2: Backend Routers & MCP Tools

### Task 4: Router Changes — exercises.py

**Files:**
- Modify: `backend/routers/exercises.py:11-24`

- [ ] **Step 1: Update schemas and formatter**

```python
# Import TrackingType from database

# ExerciseCreate — add:
    tracking_type: TrackingType = TrackingType.reps_weight

# ExerciseUpdate — add:
    tracking_type: TrackingType | None = None

# _fmt() — add to returned dict:
    "tracking_type": e.tracking_type
```

Pass `tracking_type` in create and update handlers.

- [ ] **Step 2: Commit**

```bash
git add backend/routers/exercises.py
git commit -m "feat: add tracking_type to exercise REST endpoints"
```

### Task 5: Router Changes — sets.py

**Files:**
- Modify: `backend/routers/sets.py:1-51`

- [ ] **Step 1: Add SetResponse model, update schemas and handlers**

```python
from pydantic import BaseModel
from database import TrackingType, WorkoutExercise, Exercise

class SetResponse(BaseModel):
    id: int
    workout_exercise_id: int
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None

class SetCreate(BaseModel):
    workout_exercise_id: int
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None

class SetUpdate(BaseModel):
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None
```

Update `log_set` handler:
1. Use `session.get(WorkoutExercise, body.workout_exercise_id)` directly → 404 if not found
2. Use `session.get(Exercise, we.exercise_id)` directly → 404 if not found
3. Validate fields against `tracking_type` per spec validation table → 422 on mismatch
4. Call service, return `SetResponse`

Update `update_set` handler: pass `duration_sec`, return `SetResponse`. No validation on PATCH — cross-type field writes silently accepted per spec.

Remove `_fmt()` helper — use `SetResponse(**detail.__dict__)` or equivalent.

Both endpoints: `response_model=SetResponse, response_model_exclude_none=True`

- [ ] **Step 2: Commit**

```bash
git add backend/routers/sets.py
git commit -m "feat: add set validation by tracking type and SetResponse model"
```

### Task 6: Router Changes — workouts.py

**Files:**
- Modify: `backend/routers/workouts.py:81-90`

- [ ] **Step 1: Update get_workout_detail response dicts**

Exercise dict — add `tracking_type`:
```python
"tracking_type": exercise.tracking_type if exercise else None,
```

Set dict — add `duration_sec`:
```python
{"id": s.id, "rep_count": s.rep_count, "weight": s.weight, "duration_sec": s.duration_sec}
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/workouts.py
git commit -m "feat: include tracking_type and duration_sec in workout detail response"
```

### Task 7: MCP Tools — exercises.py

**Files:**
- Modify: `backend/tools/exercises.py:9-34`

- [ ] **Step 1: Update existing tools and add update_exercise**

`list_exercises`: add `"tracking_type": e.tracking_type` to return dict.

`create_exercise`: add `tracking_type: str = "reps_weight"` parameter. Convert to `TrackingType` enum. Pass to service. Include in return dict.

Add new `update_exercise` tool:
```python
@mcp.tool()
def update_exercise(exercise_id: int, name: str | None = None, vn_name: str | None = None,
                    muscle_group_id: int | None = None, tracking_type: str | None = None) -> dict:
    """Update an existing exercise."""
    with Session(engine) as session:
        tracking_type_enum = TrackingType(tracking_type) if tracking_type else None
        exercise = ExerciseService(session).update(
            exercise_id, name=name, vn_name=vn_name,
            muscle_group_id=muscle_group_id, tracking_type=tracking_type_enum
        )
        if not exercise:
            return {"error": "Exercise not found"}
        return {"id": exercise.id, "name": exercise.name, "vn_name": exercise.vn_name,
                "muscle_group_id": exercise.muscle_group_id, "tracking_type": exercise.tracking_type}
```

- [ ] **Step 2: Commit**

```bash
git add backend/tools/exercises.py
git commit -m "feat: add tracking_type to exercise MCP tools, add update_exercise tool"
```

### Task 8: MCP Tools — sets.py

**Files:**
- Modify: `backend/tools/sets.py:9-42`

- [ ] **Step 1: Update log_set and update_set tools**

`log_set`: make `rep_count` and `weight` optional (default `None`), add `duration_sec: int | None = None`. Pass all to service. Include `duration_sec` in return dict.

`update_set`: remove hard requirement for both `rep_count` and `weight` (make them optional). Add `duration_sec: int | None = None`. Include `duration_sec` in return dict.

- [ ] **Step 2: Commit**

```bash
git add backend/tools/sets.py
git commit -m "feat: update set MCP tools for multi-type exercise support"
```

### Task 9: MCP Tools — workouts.py

**Files:**
- Modify: `backend/tools/workouts.py:52-96`

- [ ] **Step 1: Update get_workout_detail and volume tools**

`get_workout_detail`: add `"tracking_type": exercise.tracking_type` to exercise dicts, add `"duration_sec": s.duration_sec` to set dicts.

`get_muscle_group_workouts`: no changes needed (volume calc is in the service layer, already fixed in Task 3).

- [ ] **Step 2: Commit**

```bash
git add backend/tools/workouts.py
git commit -m "feat: include tracking_type and duration_sec in workout detail MCP tool"
```

## Chunk 3: Frontend Changes

### Task 10: Regenerate API Types

**Files:**
- Regenerate: `frontend/src/api/` and `frontend/openapi.json`

- [ ] **Step 1: Start backend, regenerate OpenAPI spec and types**

```bash
cd backend && uv run python api.py &
sleep 3
curl http://localhost:8000/api/openapi.json > frontend/openapi.json
cd frontend && npm run generate
# Stop the backend
kill %1
```

Verify generated types include `TrackingType` union and `SetResponse` model.

- [ ] **Step 2: Commit**

```bash
git add frontend/openapi.json frontend/src/api/
git commit -m "feat: regenerate API types with tracking type support"
```

### Task 11: Update Workout Log Detail Types

**Files:**
- Modify: `frontend/src/components/workout-log-detail/types.ts`

- [ ] **Step 1: Update interfaces**

```typescript
// Import TrackingType from generated API types (exact path from orval output)

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
  tracking_type: TrackingType  // new
  sets: SetData[]
}

// Update Exercise interface too:
export interface Exercise {
  id: number
  name: string
  vn_name: string
  muscle_group_id: number
  tracking_type: TrackingType  // new
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workout-log-detail/types.ts
git commit -m "feat: add tracking_type and duration_sec to workout log detail types"
```

### Task 12: Update useWorkoutLogDetail Hook

**Files:**
- Modify: `frontend/src/components/workout-log-detail/hooks/useWorkoutLogDetail.ts`

- [ ] **Step 1: Add duration state and update submit/update handlers**

Add state:
```typescript
const [durationSec, setDurationSec] = useState('')
```

Update `handleSubmitSet` to conditionally build payload based on `tracking_type` of the exercise being added to:
- `reps_weight`: submit `rep_count` + `weight`
- `bodyweight`: submit `rep_count` + optional `weight` (omit if 0/empty)
- `duration`: submit `duration_sec` only

Update `handleUpdateSet` to accept and pass `duration_sec`.

Reset `durationSec` alongside `repCount`/`weight` on successful submit.

Expose `durationSec`, `onDurationSecChange` from hook return.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workout-log-detail/hooks/useWorkoutLogDetail.ts
git commit -m "feat: add duration support to workout log detail hook"
```

### Task 13: Update SetRow Component

**Files:**
- Modify: `frontend/src/components/workout-log-detail/views/set-row.tsx`

- [ ] **Step 1: Add tracking_type prop and conditional rendering**

Accept `tracking_type: TrackingType` prop.

**Read mode display:**
- `reps_weight`: `{weight}kg × {rep_count} reps`
- `bodyweight`: `{rep_count} reps` + `+{weight}kg` only if weight > 0
- `duration`: format as `{duration_sec}s` if < 60, else `{Math.floor(s/60)}m {s%60}s`

**Edit mode:**
- Add `editDurationSec` state
- Conditionally show inputs based on `tracking_type`
- Pass appropriate fields to `onUpdateSet`

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workout-log-detail/views/set-row.tsx
git commit -m "feat: conditional set display and edit by tracking type"
```

### Task 14: Update ExerciseItem Component

**Files:**
- Modify: `frontend/src/components/workout-log-detail/views/exercise-item.tsx`

- [ ] **Step 1: Update add set form and progress summary**

Pass `tracking_type` to each `SetRow`.

**Add set form inputs per type:**
- `reps_weight`: Weight (kg) required + Reps required (current behavior)
- `bodyweight`: Reps required + Weight (kg) optional
- `duration`: Duration (seconds) required

**Progress summary (replaces Volume label):**
- `reps_weight`: `Σ(rep_count × weight)` → `X kg`
- `bodyweight`: total reps + optional added volume → `X reps [+ Y kg]`
- `duration`: `Σ(duration_sec)` formatted → `Xm Ys`

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/workout-log-detail/views/exercise-item.tsx
git commit -m "feat: conditional add set form and progress summary by tracking type"
```

### Task 15: Update Exercise Library

**Files:**
- Modify: `frontend/src/components/exercise-library/types.ts`
- Modify: `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/types.ts`
- Modify: `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/hooks/useExerciseRow.tsx`
- Modify: `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/views/edit.tsx`
- Modify: `frontend/src/components/exercise-library/muscle-group-accordion/exercise-row/container.tsx`
- Modify: `frontend/src/components/exercise-library/muscle-group-accordion/hooks/useMuscleGroupAccordion.tsx`
- Modify: `frontend/src/components/exercise-library/muscle-group-accordion/views/main.tsx` (inline create form)

- [ ] **Step 1: Update exercise-library/types.ts**

Add `tracking_type: TrackingType` to `Exercise` interface. Import from generated types.

- [ ] **Step 2: Update exercise-row types and edit view**

Add to `ExerciseRowEditViewProps`:
- `trackingType: string`
- `onTrackingTypeChange: (value: string) => void`

Add tracking type `<Select>` in edit view with options: Weighted / Bodyweight / Duration (values: `reps_weight`, `bodyweight`, `duration`).

- [ ] **Step 3: Update useExerciseRow hook**

Add `trackingType` state initialized from `exercise.tracking_type`.
Include `tracking_type: trackingType` in `updateMutation.mutate()` call.
Expose `trackingType` and `onTrackingTypeChange` handler.

- [ ] **Step 4: Update exercise-row container to pass new props**

Wire `trackingType` and `onTrackingTypeChange` from hook to edit view.

- [ ] **Step 5: Update useMuscleGroupAccordion hook**

Add `trackingType` state (default `"reps_weight"`).
Include `tracking_type: trackingType` in `createExerciseMutation.mutate()`.
Show tracking type `<Select>` in inline create form.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/exercise-library/
git commit -m "feat: add tracking type selection to exercise library CRUD"
```

### Task 16: Final Verification

- [ ] **Step 1: Start backend and frontend, verify end-to-end**

```bash
cd backend && uv run python api.py &
cd frontend && npm run dev &
```

Test:
1. Exercise library: edit an exercise → change tracking type → save
2. Create a new exercise with bodyweight type
3. Workout log: add a set to a bodyweight exercise → only reps input shown
4. Workout log: add a set to a duration exercise → only duration input shown
5. Edit an existing set → correct inputs shown
6. Progress summary displays correctly per type

- [ ] **Step 2: Final commit if any fixes needed**
