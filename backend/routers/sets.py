from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from database import TrackingType, WorkoutExercise, Exercise
from deps import get_session
from services.workout_exercise_detail import WorkoutExerciseDetailService
from auth import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])


class SetResponse(BaseModel):
    id: int
    workout_exercise_id: int
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None


class SetCreate(BaseModel):
    workout_exercise_id: int
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None


class SetUpdate(BaseModel):
    rep_count: int | None = None
    weight: float | None = None
    duration_sec: int | None = None


@router.post("", status_code=201, response_model=SetResponse, response_model_exclude_none=True)
def log_set(body: SetCreate, session: Session = Depends(get_session)):
    we = session.get(WorkoutExercise, body.workout_exercise_id)
    if not we:
        raise HTTPException(status_code=404, detail="WorkoutExercise not found")

    exercise = session.get(Exercise, we.exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if exercise.tracking_type == TrackingType.reps_weight:
        if body.rep_count is None or body.weight is None:
            raise HTTPException(status_code=422, detail="rep_count and weight required for reps_weight exercises")
    elif exercise.tracking_type == TrackingType.bodyweight:
        if body.rep_count is None:
            raise HTTPException(status_code=422, detail="rep_count required for bodyweight exercises")
    elif exercise.tracking_type == TrackingType.duration:
        if body.duration_sec is None:
            raise HTTPException(status_code=422, detail="duration_sec required for duration exercises")

    detail = WorkoutExerciseDetailService(session).create(
        body.workout_exercise_id,
        rep_count=body.rep_count,
        weight=body.weight,
        duration_sec=body.duration_sec,
    )
    return SetResponse(
        id=detail.id,
        workout_exercise_id=detail.workout_exercise_id,
        rep_count=detail.rep_count,
        weight=detail.weight,
        duration_sec=detail.duration_sec,
    )


@router.patch("/{set_id}", response_model=SetResponse, response_model_exclude_none=True)
def update_set(set_id: int, body: SetUpdate, session: Session = Depends(get_session)):
    detail = WorkoutExerciseDetailService(session).update(
        set_id,
        rep_count=body.rep_count,
        weight=body.weight,
        duration_sec=body.duration_sec,
    )
    if not detail:
        raise HTTPException(status_code=404, detail="Set not found")
    return SetResponse(
        id=detail.id,
        workout_exercise_id=detail.workout_exercise_id,
        rep_count=detail.rep_count,
        weight=detail.weight,
        duration_sec=detail.duration_sec,
    )


@router.delete("/{set_id}", status_code=204)
def delete_set(set_id: int, session: Session = Depends(get_session)):
    deleted = WorkoutExerciseDetailService(session).delete(set_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Set not found")
