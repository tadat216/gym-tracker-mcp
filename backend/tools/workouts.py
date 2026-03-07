import calendar as cal_module

from fastmcp import FastMCP
from sqlmodel import Session

from database import engine
from services import ExerciseService, WorkoutExerciseDetailService, WorkoutExerciseService, WorkoutService
from utils import today_vn


def register(mcp: FastMCP) -> None:
    @mcp.tool()
    def get_current_date() -> str:
        """Returns today's date in ISO 8601 format (YYYY-MM-DD)."""
        return today_vn()

    @mcp.tool()
    def get_calendar(month: int, year: int | None = None) -> dict:
        """Returns a calendar for the given month (1-12) and optional year (defaults to
        current year). Each week is a list of day numbers (0 = no day for that slot).
        Also returns which dates in that month have workouts logged."""
        cal_year = year or int(today_vn()[:4])
        weeks = cal_module.monthcalendar(cal_year, month)

        with Session(engine) as session:
            workouts = WorkoutService(session).list_in_month(cal_year, month)

        return {
            "year": cal_year,
            "month": month,
            "month_name": cal_module.month_name[month],
            "weeks": weeks,
            "workout_dates": [w.date for w in workouts],
        }

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

    @mcp.tool()
    def create_workout(workout_date: str | None = None) -> dict:
        """Create a workout for a given date (ISO 8601, defaults to today).
        Returns existing workout if one already exists for that date (one per day)."""
        target_date = workout_date or today_vn()
        with Session(engine) as session:
            workout = WorkoutService(session).get_or_create(target_date)
        return {"id": workout.id, "date": workout.date}
