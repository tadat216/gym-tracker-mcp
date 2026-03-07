from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from deps import get_session
from services import MuscleGroupService

router = APIRouter()


class MuscleGroupCreate(BaseModel):
    name: str
    vn_name: str


class MuscleGroupUpdate(BaseModel):
    name: str | None = None
    vn_name: str | None = None


@router.get("")
def list_muscle_groups(session: Session = Depends(get_session)):
    groups = MuscleGroupService(session).list()
    return [{"id": g.id, "name": g.name, "vn_name": g.vn_name} for g in groups]


@router.post("", status_code=201)
def create_muscle_group(body: MuscleGroupCreate, session: Session = Depends(get_session)):
    group = MuscleGroupService(session).create(body.name, body.vn_name)
    return {"id": group.id, "name": group.name, "vn_name": group.vn_name}


@router.get("/{muscle_group_id}")
def get_muscle_group(muscle_group_id: int, session: Session = Depends(get_session)):
    group = MuscleGroupService(session).get(muscle_group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    return {"id": group.id, "name": group.name, "vn_name": group.vn_name}


@router.patch("/{muscle_group_id}")
def update_muscle_group(
    muscle_group_id: int,
    body: MuscleGroupUpdate,
    session: Session = Depends(get_session),
):
    group = MuscleGroupService(session).update(muscle_group_id, body.name, body.vn_name)
    if not group:
        raise HTTPException(status_code=404, detail="Muscle group not found")
    return {"id": group.id, "name": group.name, "vn_name": group.vn_name}


@router.delete("/{muscle_group_id}", status_code=204)
def delete_muscle_group(muscle_group_id: int, session: Session = Depends(get_session)):
    deleted = MuscleGroupService(session).delete(muscle_group_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Muscle group not found")
