from fastmcp import FastMCP
from sqlmodel import Session

from database import engine
from services import WorkoutExerciseService


def register(mcp: FastMCP) -> None:
    @mcp.tool()
    def add_exercise_to_workout(workout_id: int, exercise_id: int) -> dict:
        """Add an exercise to a workout. Returns the workout_exercise record."""
        with Session(engine) as session:
            we = WorkoutExerciseService(session).create(workout_id, exercise_id)
        return {"id": we.id, "workout_id": we.workout_id, "exercise_id": we.exercise_id}
