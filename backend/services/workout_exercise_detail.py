from sqlmodel import Session, select

from database import WorkoutExerciseDetail


class WorkoutExerciseDetailService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, workout_exercise_id: int, rep_count: int, weight: float) -> WorkoutExerciseDetail:
        detail = WorkoutExerciseDetail(
            workout_exercise_id=workout_exercise_id,
            rep_count=rep_count,
            weight=weight,
        )
        self.session.add(detail)
        self.session.commit()
        self.session.refresh(detail)
        return detail

    def get(self, detail_id: int) -> WorkoutExerciseDetail | None:
        return self.session.get(WorkoutExerciseDetail, detail_id)

    def list(self, workout_exercise_id: int | None = None) -> list[WorkoutExerciseDetail]:
        query = select(WorkoutExerciseDetail)
        if workout_exercise_id is not None:
            query = query.where(WorkoutExerciseDetail.workout_exercise_id == workout_exercise_id)
        return list(self.session.exec(query).all())

    def update(
        self,
        detail_id: int,
        rep_count: int | None = None,
        weight: float | None = None,
    ) -> WorkoutExerciseDetail | None:
        detail = self.session.get(WorkoutExerciseDetail, detail_id)
        if detail is None:
            return None
        if rep_count is not None:
            detail.rep_count = rep_count
        if weight is not None:
            detail.weight = weight
        self.session.add(detail)
        self.session.commit()
        self.session.refresh(detail)
        return detail

    def delete(self, detail_id: int) -> bool:
        detail = self.session.get(WorkoutExerciseDetail, detail_id)
        if detail is None:
            return False
        self.session.delete(detail)
        self.session.commit()
        return True
