import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from mcp_instance import mcp
from routers import exercises, muscle_groups, sets, workout_exercises, workouts

init_db()

# Build the MCP ASGI app first so we can pass its lifespan to FastAPI
mcp_asgi = mcp.http_app(path="/", transport="streamable-http")

app = FastAPI(title="Gym Tracker API", version="1.0.0", lifespan=mcp_asgi.lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(muscle_groups.router, prefix="/api/muscle-groups", tags=["muscle-groups"])
app.include_router(exercises.router, prefix="/api/exercises", tags=["exercises"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(workout_exercises.router, prefix="/api/workout-exercises", tags=["workout-exercises"])
app.include_router(sets.router, prefix="/api/sets", tags=["sets"])

# Mount MCP server — endpoint available at /mcp
app.mount("/mcp", mcp_asgi)

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("api:app", host=host, port=port, reload=True)
