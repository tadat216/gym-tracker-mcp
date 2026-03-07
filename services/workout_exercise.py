from sqlmodel import Session, select

from database import WorkoutExercise


class WorkoutExerciseService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, workout_id: int, exercise_id: int) -> WorkoutExercise:
        workout_exercise = WorkoutExercise(workout_id=workout_id, exercise_id=exercise_id)
        self.session.add(workout_exercise)
        self.session.commit()
        self.session.refresh(workout_exercise)
        return workout_exercise

    def get(self, workout_exercise_id: int) -> WorkoutExercise | None:
        return self.session.get(WorkoutExercise, workout_exercise_id)

    def list(self, workout_id: int | None = None) -> list[WorkoutExercise]:
        query = select(WorkoutExercise)
        if workout_id is not None:
            query = query.where(WorkoutExercise.workout_id == workout_id)
        return list(self.session.exec(query).all())

    def delete(self, workout_exercise_id: int) -> bool:
        workout_exercise = self.session.get(WorkoutExercise, workout_exercise_id)
        if workout_exercise is None:
            return False
        self.session.delete(workout_exercise)
        self.session.commit()
        return True
