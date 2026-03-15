from enum import Enum
from pathlib import Path
from typing import Optional

from sqlmodel import Field, SQLModel, create_engine

DB_PATH = Path(__file__).parent / "gym_tracker.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)


class TrackingType(str, Enum):
    reps_weight = "reps_weight"
    bodyweight = "bodyweight"
    duration = "duration"


class MuscleGroup(SQLModel, table=True):
    __tablename__ = "muscle_groups"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    vn_name: str


class Exercise(SQLModel, table=True):
    __tablename__ = "exercises"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    vn_name: str
    muscle_group_id: int = Field(foreign_key="muscle_groups.id")
    tracking_type: TrackingType = Field(default=TrackingType.reps_weight)


class Workout(SQLModel, table=True):
    __tablename__ = "workouts"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    date: str  # ISO 8601, e.g. "2026-03-07"


class WorkoutExercise(SQLModel, table=True):
    __tablename__ = "workout_exercises"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    workout_id: int = Field(foreign_key="workouts.id")
    exercise_id: int = Field(foreign_key="exercises.id")


class WorkoutExerciseDetail(SQLModel, table=True):
    __tablename__ = "workout_exercises_details"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    workout_exercise_id: int = Field(foreign_key="workout_exercises.id")
    rep_count: int | None = Field(default=None)
    weight: float | None = Field(default=None)  # kg
    duration_sec: int | None = Field(default=None)
