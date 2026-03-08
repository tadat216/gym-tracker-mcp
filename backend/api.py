import os

# Load .env before any local imports that read env vars at module level
from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response as FastAPIResponse
from fastmcp import FastMCP
from pydantic import BaseModel

from auth import (
    AUTH_PASSWORD,
    AUTH_USERNAME,
    GymTrackerOAuthProvider,
    create_jwt,
    require_auth,
)
from database import init_db
from routers import exercises, muscle_groups, sets, workout_exercises, workouts
from tools import (
    exercises as tools_exercises,
    muscle_groups as tools_muscle_groups,
    sets as tools_sets,
    workout_exercises as tools_workout_exercises,
    workouts as tools_workouts,
)

init_db()

_base_url = os.getenv("MCP_BASE_URL", "http://127.0.0.1:8000/mcp")
mcp = FastMCP("Gym Tracker", auth=GymTrackerOAuthProvider(base_url=_base_url))
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

# ── OAuth discovery at root level (RFC 8414) ─────────────────────────────────
# FastMCP serves /.well-known/oauth-authorization-server inside its own ASGI
# (accessible at /mcp/.well-known/...), but RFC 8414 root-path discovery also
# requires it at the bare /.well-known/ path.  Forward the request directly
# into mcp_asgi so the response is identical with no redirect needed.

@app.get("/.well-known/oauth-authorization-server", include_in_schema=False)
async def oauth_discovery_root(request: Request):
    scope = dict(request.scope)
    scope["path"] = "/.well-known/oauth-authorization-server"
    scope["raw_path"] = b"/.well-known/oauth-authorization-server"

    status_code = 200
    resp_headers: list = []
    body = bytearray()

    async def send(message: dict) -> None:
        nonlocal status_code, resp_headers
        if message["type"] == "http.response.start":
            status_code = message["status"]
            resp_headers = list(message.get("headers", []))
        elif message["type"] == "http.response.body":
            body.extend(message.get("body", b""))

    await mcp_asgi(scope, request.receive, send)
    return FastAPIResponse(
        content=bytes(body),
        status_code=status_code,
        headers={k.decode(): v.decode() for k, v in resp_headers},
    )


# Mount MCP server — endpoint available at /mcp
app.mount("/mcp", mcp_asgi)

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("api:app", host=host, port=port, reload=True)
