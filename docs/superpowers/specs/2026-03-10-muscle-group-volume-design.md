# Muscle Group Volume Service — Design Spec

**Date:** 2026-03-10
**Status:** Approved

## Context

Users want to query workout history for a specific muscle group over a date range and see the training volume for that group per workout. Volume is defined as **total tonnage**: `Σ (reps × weight)` across all sets for all exercises targeting the muscle group. Bodyweight exercises (pull-ups, squats, etc.) are handled by the user manually entering their body weight as the `weight` value — no schema changes required.

## Volume Definition

```
volume_per_set    = rep_count × weight  (kg)
exercise_volume   = Σ volume_per_set for all sets of that exercise
workout_volume    = Σ exercise_volume for all exercises of the target muscle group
```

Only workouts where the muscle group was actually trained (i.e., has at least one set with a matching exercise) appear in results.

## Return Shape

```json
[
  {
    "workout_id": 1,
    "date": "2026-03-01",
    "total_volume": 1250.0,
    "exercises": [
      { "exercise_id": 3, "name": "Bench Press", "vn_name": "Đẩy ngực", "volume": 750.0 },
      { "exercise_id": 5, "name": "Incline Press", "vn_name": "Đẩy dốc",  "volume": 500.0 }
    ]
  }
]
```

## Components

### 1. Service — `WorkoutService.list_with_muscle_group_volume`

**File:** `backend/services/workout.py`

New method on the existing `WorkoutService` class:

```python
def list_with_muscle_group_volume(
    self, muscle_group_id: int, start_date: str, end_date: str
) -> list[dict]:
```

**Query strategy:** Single SQL join across four tables using SQLModel `select` with `sqlalchemy.func.sum`:

```
workouts
  JOIN workout_exercises ON workout_exercises.workout_id = workouts.id
  JOIN exercises         ON exercises.id = workout_exercises.exercise_id
  JOIN workout_exercises_details ON workout_exercises_details.workout_exercise_id = workout_exercises.id
WHERE exercises.muscle_group_id = :muscle_group_id
  AND workouts.date >= :start_date
  AND workouts.date <= :end_date
GROUP BY workouts.id, workouts.date, exercises.id, exercises.name, exercises.vn_name
ORDER BY workouts.date ASC
```

Results are aggregated in Python into the nested return shape (group by `workout_id`).

### 2. REST Endpoint

**File:** `backend/routers/workouts.py`

```
GET /api/workouts/muscle-group/{muscle_group_id}
    ?start_date=YYYY-MM-DD
    &end_date=YYYY-MM-DD
```

Returns the list described above. Both query params are required. Follows existing router patterns: `Depends(get_session)`, `Depends(require_auth)` applied at router level.

### 3. MCP Tool

**File:** `backend/tools/workouts.py`

```python
@mcp.tool()
def get_muscle_group_workouts(
    muscle_group_id: int,
    start_date: str,  # YYYY-MM-DD
    end_date: str,    # YYYY-MM-DD
) -> list[dict]:
```

Opens its own `with Session(engine) as session:` block, instantiates `WorkoutService(session)`, calls the new method. Same pattern as other tools in the file.

## No Schema Changes

Volume is `reps × weight` uniformly. Users enter body weight manually for bodyweight exercises (pull-ups, squats, etc.). No new DB columns, no migrations.

## Verification

1. Seed DB has existing workouts and sets with `weight > 0`
2. Call `GET /api/workouts/muscle-group/1?start_date=2026-01-01&end_date=2026-03-31`
   → Expect workouts where chest/back/etc. exercises were done, with correct summed volumes
3. Call MCP tool `get_muscle_group_workouts` with same params
   → Same results
4. Date with no matching exercise → workout absent from results
5. Exercise with `weight = 0` → contributes 0 to volume (expected for unset bodyweight entries)
