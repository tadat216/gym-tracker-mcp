from fastmcp import FastMCP
from sqlmodel import Session

from database import engine
from services import WorkoutExerciseDetailService


def register(mcp: FastMCP) -> None:
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
