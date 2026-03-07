from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from deps import get_session
from services import ExerciseService

router = APIRouter()


class ExerciseCreate(BaseModel):
    name: str
    vn_name: str
    muscle_group_id: int


class ExerciseUpdate(BaseModel):
    name: str | None = None
    vn_name: str | None = None
    muscle_group_id: int | None = None


def _fmt(e):
    return {"id": e.id, "name": e.name, "vn_name": e.vn_name, "muscle_group_id": e.muscle_group_id}


@router.get("")
def list_exercises(muscle_group_id: int | None = None, session: Session = Depends(get_session)):
    exercises = ExerciseService(session).list(muscle_group_id)
    return [_fmt(e) for e in exercises]


@router.post("", status_code=201)
def create_exercise(body: ExerciseCreate, session: Session = Depends(get_session)):
    exercise = ExerciseService(session).create(body.name, body.vn_name, body.muscle_group_id)
    return _fmt(exercise)


@router.get("/{exercise_id}")
def get_exercise(exercise_id: int, session: Session = Depends(get_session)):
    exercise = ExerciseService(session).get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return _fmt(exercise)


@router.patch("/{exercise_id}")
def update_exercise(
    exercise_id: int,
    body: ExerciseUpdate,
    session: Session = Depends(get_session),
):
    exercise = ExerciseService(session).update(
        exercise_id, body.name, body.vn_name, body.muscle_group_id
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return _fmt(exercise)


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(exercise_id: int, session: Session = Depends(get_session)):
    deleted = ExerciseService(session).delete(exercise_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exercise not found")
