from sqlmodel import Session, select

from database import MuscleGroup


class MuscleGroupService:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, name: str, vn_name: str) -> MuscleGroup:
        muscle_group = MuscleGroup(name=name, vn_name=vn_name)
        self.session.add(muscle_group)
        self.session.commit()
        self.session.refresh(muscle_group)
        return muscle_group

    def get(self, muscle_group_id: int) -> MuscleGroup | None:
        return self.session.get(MuscleGroup, muscle_group_id)

    def list(self) -> list[MuscleGroup]:
        return list(self.session.exec(select(MuscleGroup)).all())

    def update(self, muscle_group_id: int, name: str | None = None, vn_name: str | None = None) -> MuscleGroup | None:
        muscle_group = self.session.get(MuscleGroup, muscle_group_id)
        if muscle_group is None:
            return None
        if name is not None:
            muscle_group.name = name
        if vn_name is not None:
            muscle_group.vn_name = vn_name
        self.session.add(muscle_group)
        self.session.commit()
        self.session.refresh(muscle_group)
        return muscle_group

    def delete(self, muscle_group_id: int) -> bool:
        muscle_group = self.session.get(MuscleGroup, muscle_group_id)
        if muscle_group is None:
            return False
        self.session.delete(muscle_group)
        self.session.commit()
        return True
