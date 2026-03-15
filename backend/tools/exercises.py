from fastmcp import FastMCP
from sqlmodel import Session

from database import engine, TrackingType
from services import ExerciseService


def register(mcp: FastMCP) -> None:
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
                "tracking_type": e.tracking_type,
            }
            for e in exercises
        ]

    @mcp.tool()
    def create_exercise(name: str, vn_name: str, muscle_group_id: int, tracking_type: str = "reps_weight") -> dict:
        """Add a new exercise linked to a muscle group. Returns the created exercise."""
        with Session(engine) as session:
            tracking_type_enum = TrackingType(tracking_type)
            exercise = ExerciseService(session).create(name, vn_name, muscle_group_id, tracking_type=tracking_type_enum)
        return {
            "id": exercise.id,
            "name": exercise.name,
            "vn_name": exercise.vn_name,
            "muscle_group_id": exercise.muscle_group_id,
            "tracking_type": exercise.tracking_type,
        }

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
            return {
                "id": exercise.id,
                "name": exercise.name,
                "vn_name": exercise.vn_name,
                "muscle_group_id": exercise.muscle_group_id,
                "tracking_type": exercise.tracking_type,
            }
