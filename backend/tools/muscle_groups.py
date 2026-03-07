from fastmcp import FastMCP
from sqlmodel import Session

from database import engine
from services import MuscleGroupService


def register(mcp: FastMCP) -> None:
    @mcp.tool()
    def list_muscle_groups() -> list[dict]:
        """List all muscle groups."""
        with Session(engine) as session:
            groups = MuscleGroupService(session).list()
        return [{"id": g.id, "name": g.name, "vn_name": g.vn_name} for g in groups]

    @mcp.tool()
    def create_muscle_group(name: str, vn_name: str) -> dict:
        """Add a new muscle group. Returns the created muscle group."""
        with Session(engine) as session:
            group = MuscleGroupService(session).create(name, vn_name)
        return {"id": group.id, "name": group.name, "vn_name": group.vn_name}
