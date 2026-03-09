import calendar

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from deps import get_session
from services import ExerciseService, WorkoutExerciseDetailService, WorkoutExerciseService, WorkoutService
from utils import today_vn

router = APIRouter()


from typing import Annotated

from pydantic import BaseModel, Field


class WorkoutCreate(BaseModel):
    date: Annotated[str | None, Field(pattern=r"^\d{4}-\d{2}-\d{2}$")] = None


@router.get("")
def list_workouts(last_n_days: int = 7, session: Session = Depends(get_session)):
    workouts = WorkoutService(session).list_last_n_days(last_n_days)
    return [{"id": w.id, "date": w.date} for w in workouts]


@router.get("/range")
def list_workouts_in_range(
    start_date: str,
    end_date: str,
    session: Session = Depends(get_session),
):
    workouts = WorkoutService(session).list_in_date_range(start_date, end_date)
    return [{"id": w.id, "date": w.date} for w in workouts]


@router.get("/calendar")
def get_calendar(month: int, year: int | None = None, session: Session = Depends(get_session)):
    cal_year = year or int(today_vn()[:4])
    weeks = calendar.monthcalendar(cal_year, month)
    workouts = WorkoutService(session).list_in_month(cal_year, month)
    we_service = WorkoutExerciseService(session)
    return {
        "year": cal_year,
        "month": month,
        "month_name": calendar.month_name[month],
        "weeks": weeks,
        "workout_dates": [w.date for w in workouts if we_service.list(w.id)],
    }


@router.post("", status_code=201)
def create_workout(body: WorkoutCreate, session: Session = Depends(get_session)):
    target_date = body.date or today_vn()
    workout = WorkoutService(session).get_or_create(target_date)
    return {"id": workout.id, "date": workout.date}


@router.get("/{workout_id}")
def get_workout_detail(workout_id: int, session: Session = Depends(get_session)):
    workout = WorkoutService(session).get(workout_id)
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

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
            "sets": [{"id": s.id, "rep_count": s.rep_count, "weight": s.weight} for s in sets],
        })

    return {"id": workout.id, "date": workout.date, "exercises": result_exercises}


@router.delete("/{workout_id}", status_code=204)
def delete_workout(workout_id: int, session: Session = Depends(get_session)):
    deleted = WorkoutService(session).delete(workout_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workout not found")
