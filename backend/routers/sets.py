from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from deps import get_session
from services import WorkoutExerciseDetailService

router = APIRouter()


class SetCreate(BaseModel):
    workout_exercise_id: int
    rep_count: int
    weight: float


class SetUpdate(BaseModel):
    rep_count: int | None = None
    weight: float | None = None


def _fmt(s):
    return {
        "id": s.id,
        "workout_exercise_id": s.workout_exercise_id,
        "rep_count": s.rep_count,
        "weight": s.weight,
    }


@router.post("", status_code=201)
def log_set(body: SetCreate, session: Session = Depends(get_session)):
    detail = WorkoutExerciseDetailService(session).create(
        body.workout_exercise_id, body.rep_count, body.weight
    )
    return _fmt(detail)


@router.patch("/{set_id}")
def update_set(set_id: int, body: SetUpdate, session: Session = Depends(get_session)):
    detail = WorkoutExerciseDetailService(session).update(set_id, body.rep_count, body.weight)
    if not detail:
        raise HTTPException(status_code=404, detail="Set not found")
    return _fmt(detail)


@router.delete("/{set_id}", status_code=204)
def delete_set(set_id: int, session: Session = Depends(get_session)):
    deleted = WorkoutExerciseDetailService(session).delete(set_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Set not found")
