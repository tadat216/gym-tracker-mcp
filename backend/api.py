import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import exercises, muscle_groups, sets, workout_exercises, workouts

app = FastAPI(title="Gym Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(muscle_groups.router, prefix="/muscle-groups", tags=["muscle-groups"])
app.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(workout_exercises.router, prefix="/workout-exercises", tags=["workout-exercises"])
app.include_router(sets.router, prefix="/sets", tags=["sets"])

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8001"))
    uvicorn.run("api:app", host=host, port=port, reload=True)
