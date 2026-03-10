# Muscle Group Volume Service Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a service method, REST endpoint, and MCP tool that return workouts in a date range for a specific muscle group, with volume (`Σ reps × weight`) per workout.

**Architecture:** New `list_with_muscle_group_volume` method on `WorkoutService` using a single SQL join across `workouts → workout_exercises → exercises → workout_exercises_details`, filtered by `muscle_group_id` and date range. Results are aggregated in Python into per-workout objects with per-exercise volume breakdown. Exposed via a new REST GET endpoint and a new MCP tool.

**Tech Stack:** Python 3.12, SQLModel, SQLAlchemy (`func.sum`), FastAPI, FastMCP. No schema changes, no new DB columns.

---

## Chunk 1: Service Method

### Task 1: Add `list_with_muscle_group_volume` to `WorkoutService`

**Files:**
- Modify: `backend/services/workout.py`

**Context:**
- `WorkoutService` lives in `backend/services/workout.py`
- It already imports `from sqlmodel import Session, select` and `from database import Workout`
- The new method needs multi-table joins: `WorkoutExercise`, `Exercise`, `WorkoutExerciseDetail` from `database`
- Aggregate sums require `from sqlalchemy import func`
- No test framework is configured — verify by running the server and calling the endpoint manually

- [x] **Step 1: Add new imports to `backend/services/workout.py`**

  At the top of the file, the current imports are:
  ```python
  from database import Workout
  ```
  Change to:
  ```python
  from sqlalchemy import func
  from database import Exercise, Workout, WorkoutExercise, WorkoutExerciseDetail
  ```

- [x] **Step 2: Add the service method at the end of `WorkoutService`**

  Append this method inside `WorkoutService` (after `delete`):

  ```python
  def list_with_muscle_group_volume(
      self, muscle_group_id: int, start_date: str, end_date: str
  ) -> list[dict]:
      rows = self.session.exec(
          select(
              Workout.id,
              Workout.date,
              Exercise.id,
              Exercise.name,
              Exercise.vn_name,
              func.sum(WorkoutExerciseDetail.rep_count * WorkoutExerciseDetail.weight).label("volume"),
          )
          .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)  # type: ignore[arg-type]
          .join(Exercise, Exercise.id == WorkoutExercise.exercise_id)  # type: ignore[arg-type]
          .join(WorkoutExerciseDetail, WorkoutExerciseDetail.workout_exercise_id == WorkoutExercise.id)  # type: ignore[arg-type]
          .where(Exercise.muscle_group_id == muscle_group_id)  # type: ignore[arg-type]
          .where(Workout.date >= start_date)  # type: ignore[arg-type]
          .where(Workout.date <= end_date)  # type: ignore[arg-type]
          .group_by(Workout.id, Workout.date, Exercise.id, Exercise.name, Exercise.vn_name)
          .order_by(Workout.date)  # type: ignore[arg-type]
      ).all()

      workouts: dict[int, dict] = {}
      for workout_id, date, exercise_id, name, vn_name, volume in rows:
          if workout_id not in workouts:
              workouts[workout_id] = {
                  "workout_id": workout_id,
                  "date": date,
                  "total_volume": 0.0,
                  "exercises": [],
              }
          v = float(volume or 0.0)
          workouts[workout_id]["exercises"].append({
              "exercise_id": exercise_id,
              "name": name,
              "vn_name": vn_name,
              "volume": v,
          })
          workouts[workout_id]["total_volume"] += v

      return list(workouts.values())
  ```

- [x] **Step 3: Smoke-test by starting the backend**

  ```bash
  cd backend && uv run python api.py
  ```
  Expected: server starts on port 8000 with no import errors.

- [x] **Step 4: Commit**

  ```bash
  git add backend/services/workout.py
  git commit -m "feat: add list_with_muscle_group_volume to WorkoutService"
  ```

---

## Chunk 2: REST Endpoint

### Task 2: Add REST endpoint to the workouts router

**Files:**
- Modify: `backend/routers/workouts.py`

**Context:**
- All workout routes are in `backend/routers/workouts.py` under `router = APIRouter()`
- The router is mounted at `/api/workouts` in `api.py` with `Depends(require_auth)` applied at router level
- The new route `GET /muscle-group/{muscle_group_id}` must be placed **before** `GET /{workout_id}` to ensure FastAPI doesn't treat "muscle-group" as an integer path param (even though `{workout_id: int}` won't match the string, ordering is correct practice)
- `start_date` and `end_date` are required query parameters (no default — missing them should 422)

- [x] **Step 1: Add the new route before `/{workout_id}` in `backend/routers/workouts.py`**

  Insert this block immediately before the `@router.get("/{workout_id}")` handler (currently at line 61):

  ```python
  @router.get("/muscle-group/{muscle_group_id}")
  def get_muscle_group_volume(
      muscle_group_id: int,
      start_date: str,
      end_date: str,
      session: Session = Depends(get_session),
  ):
      return WorkoutService(session).list_with_muscle_group_volume(
          muscle_group_id, start_date, end_date
      )
  ```

- [ ] **Step 2: Restart backend and verify the route appears in docs** *(manual)*

  ```bash
  # Ctrl-C the running server, then:
  cd backend && uv run python api.py
  ```
  Open `http://localhost:8000/api/docs` — confirm `GET /api/workouts/muscle-group/{muscle_group_id}` is listed.

- [ ] **Step 3: Call the endpoint manually to verify output**

  Pick a real `muscle_group_id` from your DB (e.g., 1 for chest). Then:

  ```bash
  curl -s "http://localhost:8000/api/workouts/muscle-group/1?start_date=2026-01-01&end_date=2026-03-31" \
    -H "Authorization: Bearer <your-jwt-token>" | python3 -m json.tool
  ```

  Expected response shape:
  ```json
  [
    {
      "workout_id": 5,
      "date": "2026-03-01",
      "total_volume": 1250.0,
      "exercises": [
        { "exercise_id": 3, "name": "Bench Press", "vn_name": "Đẩy ngực", "volume": 750.0 },
        { "exercise_id": 5, "name": "Incline Press", "vn_name": "Đẩy dốc",  "volume": 500.0 }
      ]
    }
  ]
  ```

  If the date range has no workouts for that muscle group → empty array `[]`.

- [ ] **Step 4: Regenerate OpenAPI spec and frontend hooks**

  With the backend still running:
  ```bash
  curl http://localhost:8000/api/openapi.json > frontend/openapi.json
  cd frontend && npm run generate
  ```
  Expected: `frontend/src/api/workouts/` regenerated with new hook for the endpoint.

- [x] **Step 5: Commit** *(committed as part of combined commit eb011a6)*

---

## Chunk 3: MCP Tool

### Task 3: Add MCP tool for muscle group volume

**Files:**
- Modify: `backend/tools/workouts.py`

**Context:**
- All workout MCP tools are in the `register(mcp: FastMCP)` function in `backend/tools/workouts.py`
- Each tool opens its own `with Session(engine) as session:` block — do NOT use `deps.get_session`
- `engine` is already imported from `database`
- `WorkoutService` is already imported from `services`

- [x] **Step 1: Add the tool inside the `register` function in `backend/tools/workouts.py`**

  Append this at the end of the `register` function (after `create_workout`):

  ```python
  @mcp.tool()
  def get_muscle_group_workouts(
      muscle_group_id: int,
      start_date: str,
      end_date: str,
  ) -> list[dict]:
      """Get workouts for a specific muscle group within a date range, with training volume
      per workout. Volume = Σ (reps × weight) for all sets of exercises targeting that muscle
      group. Dates are ISO 8601 (YYYY-MM-DD). Returns only workouts where the muscle group
      was actually trained."""
      with Session(engine) as session:
          return WorkoutService(session).list_with_muscle_group_volume(
              muscle_group_id, start_date, end_date
          )
  ```

- [ ] **Step 2: Restart backend and confirm tool is registered** *(manual)*

  ```bash
  cd backend && uv run python api.py
  ```
  No errors on startup. The tool should now appear when claude.ai connects via MCP.

- [ ] **Step 3: Test the MCP tool via the running server (optional)**

  If you have an MCP client available, call:
  ```
  get_muscle_group_workouts(muscle_group_id=1, start_date="2026-01-01", end_date="2026-03-31")
  ```
  Expected: same structure as the REST endpoint.

- [x] **Step 4: Commit** *(committed as part of combined commit eb011a6)*
