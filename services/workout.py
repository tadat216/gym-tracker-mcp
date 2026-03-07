from sqlmodel import Session, select

from database import Workout


class WorkoutService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, date: str) -> Workout:
        workout = Workout(date=date)
        self.session.add(workout)
        self.session.commit()
        self.session.refresh(workout)
        return workout

    def get(self, workout_id: int) -> Workout | None:
        return self.session.get(Workout, workout_id)

    def list(self) -> list[Workout]:
        return list(self.session.exec(select(Workout).order_by(Workout.date.desc())).all())  # type: ignore[arg-type]

    def update(self, workout_id: int, date: str) -> Workout | None:
        workout = self.session.get(Workout, workout_id)
        if workout is None:
            return None
        workout.date = date
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
