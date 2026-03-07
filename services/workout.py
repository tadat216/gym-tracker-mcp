from __future__ import annotations

from datetime import datetime, timedelta

from sqlmodel import Session, select

from database import Workout
from utils import VN_TZ, today_vn


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
