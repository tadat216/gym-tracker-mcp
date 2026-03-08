import os

# Load .env before any local imports that read env vars at module level
from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import Depends, FastAPI, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

from auth import (
    AUTH_PASSWORD,
    AUTH_USERNAME,
    LOGIN_FORM_HTML,
    create_jwt,
    require_auth,
)
from database import init_db
from mcp_instance import mcp
from routers import exercises, muscle_groups, sets, workout_exercises, workouts

init_db()

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

# ── MCP OAuth login form routes ───────────────────────────────────────────────
# These must be FastAPI routes (not MCP routes) so they're served on the main app.
# The MCP OAuth provider redirects to /auth/login; these routes handle the form.

def _get_oauth_provider():
    """Get the OAuth provider from the FastMCP instance."""
    return mcp.auth  # type: ignore[attr-defined]


@app.get("/auth/login", response_class=HTMLResponse, include_in_schema=False)
async def login_page(request_id: str):
    """Serve the OAuth login form."""
    return LOGIN_FORM_HTML.format(request_id=request_id, error="")


@app.post("/auth/login", include_in_schema=False)
async def login_submit(
    request_id: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
):
    """Handle login form POST. Validates credentials and completes OAuth flow."""
    provider = _get_oauth_provider()

    if username != AUTH_USERNAME or password != AUTH_PASSWORD:
        return HTMLResponse(
            LOGIN_FORM_HTML.format(
                request_id=request_id,
                error='<p class="error">Invalid username or password.</p>',
            ),
            status_code=200,
        )

    redirect_url = provider.complete_authorization(request_id, username)
    if redirect_url is None:
        raise HTTPException(status_code=400, detail="Invalid or expired login request")

    return RedirectResponse(url=redirect_url, status_code=302)


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

# Mount MCP server — endpoint available at /mcp
app.mount("/mcp", mcp_asgi)

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("api:app", host=host, port=port, reload=True)
