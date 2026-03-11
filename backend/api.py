import os

# Load .env before any local imports that read env vars at module level
from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastmcp import FastMCP
from pydantic import BaseModel

from auth import AUTH_PASSWORD, AUTH_USERNAME, create_jwt, require_auth
from routers import exercises, muscle_groups, sets, workout_exercises, workouts
from tools import (
    exercises as tools_exercises,
    muscle_groups as tools_muscle_groups,
    sets as tools_sets,
    workout_exercises as tools_workout_exercises,
    workouts as tools_workouts,
)

mcp = FastMCP("Gym Tracker")
tools_muscle_groups.register(mcp)
tools_exercises.register(mcp)
tools_workouts.register(mcp)
tools_workout_exercises.register(mcp)
tools_sets.register(mcp)

# Build the MCP ASGI app first so we can pass its lifespan to FastAPI
mcp_asgi = mcp.http_app(path="/", transport="streamable-http")

app = FastAPI(
    title="Gym Tracker API",
    version="1.0.0",
    lifespan=mcp_asgi.lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST auth endpoint ────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@app.post("/api/auth/login", response_model=LoginResponse, tags=["auth"])
async def api_login(body: LoginRequest):
    """Exchange username/password for a JWT (used by the React frontend)."""
    if body.username != AUTH_USERNAME or body.password != AUTH_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return LoginResponse(access_token=create_jwt(body.username))


# ── Protected API routers ─────────────────────────────────────────────────────

_auth_dep = [Depends(require_auth)]

app.include_router(muscle_groups.router, prefix="/api/muscle-groups", tags=["muscle-groups"], dependencies=_auth_dep)
app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"], dependencies=_auth_dep)
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"], dependencies=_auth_dep)
app.include_router(workout_exercises.router, prefix="/api/workout-exercises", tags=["workout-exercises"], dependencies=_auth_dep)
app.include_router(sets.router, prefix="/api/sets", tags=["sets"], dependencies=_auth_dep)

# Mount MCP server — endpoint available at /mcp (no auth required)
app.mount("/mcp", mcp_asgi)

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("api:app", host=host, port=port, reload=True)
