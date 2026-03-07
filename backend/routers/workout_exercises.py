from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from deps import get_session
from services import WorkoutExerciseService

router = APIRouter()


class WorkoutExerciseCreate(BaseModel):
    workout_id: int
    exercise_id: int


@router.post("", status_code=201)
def add_exercise_to_workout(body: WorkoutExerciseCreate, session: Session = Depends(get_session)):
    we = WorkoutExerciseService(session).create(body.workout_id, body.exercise_id)
    return {"id": we.id, "workout_id": we.workout_id, "exercise_id": we.exercise_id}


@router.delete("/{workout_exercise_id}", status_code=204)
def remove_exercise_from_workout(
    workout_exercise_id: int,
    session: Session = Depends(get_session),
):
    deleted = WorkoutExerciseService(session).delete(workout_exercise_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workout exercise not found")
