import calendar
from datetime import date

from fastmcp import FastMCP
from sqlmodel import Session

from database import engine, init_db
from services import (
    ExerciseService,
    MuscleGroupService,
    WorkoutExerciseDetailService,
    WorkoutExerciseService,
    WorkoutService,
)

mcp = FastMCP("Gym Tracker")

init_db()


# ---------------------------------------------------------------------------
# Utility / Context Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def get_current_date() -> str:
    """Returns today's date in ISO 8601 format (YYYY-MM-DD)."""
    return date.today().isoformat()


@mcp.tool()
def get_calendar(month: int, year: int | None = None) -> dict:
    """Returns a calendar for the given month (1-12) and optional year (defaults to
    current year). Each week is a list of day numbers (0 = no day for that slot).
    Also returns which dates in that month have workouts logged."""
    cal_year = year or date.today().year
    weeks = calendar.monthcalendar(cal_year, month)

    with Session(engine) as session:
        workouts = WorkoutService(session).list_in_month(cal_year, month)

    return {
        "year": cal_year,
        "month": month,
        "month_name": calendar.month_name[month],
        "weeks": weeks,
        "workout_dates": [w.date for w in workouts],
    }


# ---------------------------------------------------------------------------
# Reference Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def list_muscle_groups() -> list[dict]:
    """List all muscle groups."""
    with Session(engine) as session:
        groups = MuscleGroupService(session).list()
    return [{"id": g.id, "name": g.name, "vn_name": g.vn_name} for g in groups]


@mcp.tool()
def list_exercises(muscle_group_id: int | None = None) -> list[dict]:
    """List exercises, optionally filtered by muscle group ID."""
    with Session(engine) as session:
        exercises = ExerciseService(session).list(muscle_group_id)
    return [
        {
            "id": e.id,
            "name": e.name,
            "vn_name": e.vn_name,
            "muscle_group_id": e.muscle_group_id,
        }
        for e in exercises
    ]


@mcp.tool()
def create_muscle_group(name: str, vn_name: str) -> dict:
    """Add a new muscle group. Returns the created muscle group."""
    with Session(engine) as session:
        group = MuscleGroupService(session).create(name, vn_name)
    return {"id": group.id, "name": group.name, "vn_name": group.vn_name}


@mcp.tool()
def create_exercise(name: str, vn_name: str, muscle_group_id: int) -> dict:
    """Add a new exercise linked to a muscle group. Returns the created exercise."""
    with Session(engine) as session:
        exercise = ExerciseService(session).create(name, vn_name, muscle_group_id)
    return {
        "id": exercise.id,
        "name": exercise.name,
        "vn_name": exercise.vn_name,
        "muscle_group_id": exercise.muscle_group_id,
    }


# ---------------------------------------------------------------------------
# Workout Query Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def list_workouts(last_n_days: int = 7) -> list[dict]:
    """List workouts from the last N days (default: 7)."""
    with Session(engine) as session:
        workouts = WorkoutService(session).list_last_n_days(last_n_days)
    return [{"id": w.id, "date": w.date} for w in workouts]


@mcp.tool()
def list_workouts_in_range(start_date: str, end_date: str) -> list[dict]:
    """List workouts between start_date and end_date inclusive (ISO 8601: YYYY-MM-DD)."""
    with Session(engine) as session:
        workouts = WorkoutService(session).list_in_date_range(start_date, end_date)
    return [{"id": w.id, "date": w.date} for w in workouts]


@mcp.tool()
def get_workout_detail(workout_id: int) -> dict:
    """Get full detail of a workout including all exercises and their sets."""
    with Session(engine) as session:
        workout = WorkoutService(session).get(workout_id)
        if not workout:
            return {"error": f"Workout {workout_id} not found"}

        workout_exercises = WorkoutExerciseService(session).list(workout_id)

        result_exercises = []
        for we in workout_exercises:
            exercise = ExerciseService(session).get(we.exercise_id)
            sets = WorkoutExerciseDetailService(session).list(we.id)
            result_exercises.append({
                "workout_exercise_id": we.id,
                "exercise_id": we.exercise_id,
                "name": exercise.name if exercise else None,
                "vn_name": exercise.vn_name if exercise else None,
                "sets": [
                    {"id": s.id, "rep_count": s.rep_count, "weight": s.weight}
                    for s in sets
                ],
            })

    return {
        "id": workout.id,
        "date": workout.date,
        "exercises": result_exercises,
    }


# ---------------------------------------------------------------------------
# Workout Logging Tools
# ---------------------------------------------------------------------------


@mcp.tool()
def create_workout(workout_date: str | None = None) -> dict:
    """Create a workout for a given date (ISO 8601, defaults to today).
    Returns existing workout if one already exists for that date (one per day)."""
    target_date = workout_date or date.today().isoformat()
    with Session(engine) as session:
        workout = WorkoutService(session).get_or_create(target_date)
    return {"id": workout.id, "date": workout.date}


@mcp.tool()
def add_exercise_to_workout(workout_id: int, exercise_id: int) -> dict:
    """Add an exercise to a workout. Returns the workout_exercise record."""
    with Session(engine) as session:
        we = WorkoutExerciseService(session).create(workout_id, exercise_id)
    return {"id": we.id, "workout_id": we.workout_id, "exercise_id": we.exercise_id}


@mcp.tool()
def log_set(workout_exercise_id: int, rep_count: int, weight: float) -> dict:
    """Log a set for a workout exercise (reps + weight in kg). Returns the set record."""
    with Session(engine) as session:
        detail = WorkoutExerciseDetailService(session).create(workout_exercise_id, rep_count, weight)
    return {
        "id": detail.id,
        "workout_exercise_id": detail.workout_exercise_id,
        "rep_count": detail.rep_count,
        "weight": detail.weight,
    }


@mcp.tool()
def update_set(set_id: int, rep_count: int, weight: float) -> dict:
    """Update a set's rep count and weight. Returns the updated set record."""
    with Session(engine) as session:
        detail = WorkoutExerciseDetailService(session).update(set_id, rep_count, weight)
    if not detail:
        return {"error": f"Set {set_id} not found"}
    return {
        "id": detail.id,
        "workout_exercise_id": detail.workout_exercise_id,
        "rep_count": detail.rep_count,
        "weight": detail.weight,
    }


@mcp.tool()
def delete_set(set_id: int) -> dict:
    """Delete a set by ID. Returns confirmation."""
    with Session(engine) as session:
        deleted = WorkoutExerciseDetailService(session).delete(set_id)
    if not deleted:
        return {"error": f"Set {set_id} not found"}
    return {"deleted": True, "set_id": set_id}


if __name__ == "__main__":
    mcp.run()
