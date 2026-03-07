from fastmcp import FastMCP
from sqlmodel import Session

from database import engine
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
            }
            for e in exercises
        ]

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
