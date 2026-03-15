from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlmodel import Session, select

from database import Exercise, Workout, WorkoutExercise, WorkoutExerciseDetail
from utils import VN_TZ


class WorkoutService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, workout_date: str) -> Workout:
        workout = Workout(date=workout_date)
        self.session.add(workout)
        self.session.commit()
        self.session.refresh(workout)
        return workout

    def get_or_create(self, workout_date: str) -> Workout:
        existing = self.session.exec(select(Workout).where(Workout.date == workout_date)).first()
        if existing:
            return existing
        return self.create(workout_date)

    def get(self, workout_id: int) -> Workout | None:
        return self.session.get(Workout, workout_id)

    def list(self) -> list[Workout]:
        return list(self.session.exec(select(Workout).order_by(Workout.date.desc())).all())  # type: ignore[arg-type]

    def list_last_n_days(self, n: int) -> list[Workout]:
        since = (datetime.now(VN_TZ).date() - timedelta(days=n)).isoformat()
        return list(
            self.session.exec(
                select(Workout).where(Workout.date >= since).order_by(Workout.date.desc())  # type: ignore[arg-type]
            ).all()
        )

    def list_in_date_range(self, start_date: str, end_date: str) -> list[Workout]:
        return list(
            self.session.exec(
                select(Workout)
                .where(Workout.date >= start_date)  # type: ignore[arg-type]
                .where(Workout.date <= end_date)  # type: ignore[arg-type]
                .order_by(Workout.date.desc())  # type: ignore[arg-type]
            ).all()
        )

    def list_in_month(self, year: int, month: int) -> list[Workout]:
        prefix = f"{year}-{month:02d}-"
        return list(
            self.session.exec(
                select(Workout).where(Workout.date.startswith(prefix)).order_by(Workout.date)  # type: ignore[arg-type]
            ).all()
        )

    def update(self, workout_id: int, workout_date: str) -> Workout | None:
        workout = self.session.get(Workout, workout_id)
        if workout is None:
            return None
        workout.date = workout_date
        self.session.add(workout)
        self.session.commit()
        self.session.refresh(workout)
        return workout

    def delete(self, workout_id: int) -> bool:
        workout = self.session.get(Workout, workout_id)
        if workout is None:
            return False
        self.session.delete(workout)
        self.session.commit()
        return True

    def list_with_muscle_group_volume(
        self, muscle_group_id: int, start_date: str, end_date: str
    ) -> list[dict]:
        rows = self.session.exec(
            select(
                Workout.id,
                Workout.date,
                Exercise.id,
                Exercise.name,
                Exercise.vn_name,
                func.sum(func.coalesce(WorkoutExerciseDetail.rep_count, 0) * func.coalesce(WorkoutExerciseDetail.weight, 0)).label("volume"),
            )
            .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)  # type: ignore[arg-type]
            .join(Exercise, Exercise.id == WorkoutExercise.exercise_id)  # type: ignore[arg-type]
            .join(WorkoutExerciseDetail, WorkoutExerciseDetail.workout_exercise_id == WorkoutExercise.id)  # type: ignore[arg-type]
            .where(Exercise.muscle_group_id == muscle_group_id)  # type: ignore[arg-type]
            .where(Workout.date >= start_date)  # type: ignore[arg-type]
            .where(Workout.date <= end_date)  # type: ignore[arg-type]
            .group_by(Workout.id, Workout.date, Exercise.id, Exercise.name, Exercise.vn_name)
            .order_by(Workout.date)  # type: ignore[arg-type]
        ).all()

        workouts: dict[int, dict] = {}
        for workout_id, date, exercise_id, name, vn_name, volume in rows:
            if workout_id not in workouts:
                workouts[workout_id] = {
                    "workout_id": workout_id,
                    "date": date,
                    "total_volume": 0.0,
                    "exercises": [],
                }
            v = float(volume or 0.0)
            workouts[workout_id]["exercises"].append({
                "exercise_id": exercise_id,
                "name": name,
                "vn_name": vn_name,
                "volume": v,
            })
            workouts[workout_id]["total_volume"] += v

        return list(workouts.values())
