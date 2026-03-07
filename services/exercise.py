from sqlmodel import Session, select

from database import Exercise


class ExerciseService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, name: str, vn_name: str, muscle_group_id: int) -> Exercise:
        exercise = Exercise(name=name, vn_name=vn_name, muscle_group_id=muscle_group_id)
        self.session.add(exercise)
        self.session.commit()
        self.session.refresh(exercise)
        return exercise

    def get(self, exercise_id: int) -> Exercise | None:
        return self.session.get(Exercise, exercise_id)

    def list(self, muscle_group_id: int | None = None) -> list[Exercise]:
        query = select(Exercise)
        if muscle_group_id is not None:
            query = query.where(Exercise.muscle_group_id == muscle_group_id)
        return list(self.session.exec(query).all())

    def update(
        self,
        exercise_id: int,
        name: str | None = None,
        vn_name: str | None = None,
        muscle_group_id: int | None = None,
    ) -> Exercise | None:
        exercise = self.session.get(Exercise, exercise_id)
        if exercise is None:
            return None
        if name is not None:
            exercise.name = name
        if vn_name is not None:
            exercise.vn_name = vn_name
        if muscle_group_id is not None:
            exercise.muscle_group_id = muscle_group_id
        self.session.add(exercise)
        self.session.commit()
        self.session.refresh(exercise)
        return exercise

    def delete(self, exercise_id: int) -> bool:
        exercise = self.session.get(Exercise, exercise_id)
        if exercise is None:
            return False
        self.session.delete(exercise)
        self.session.commit()
        return True
