import os

from dotenv import load_dotenv
from fastmcp import FastMCP

from auth import GymTrackerOAuthProvider
from tools import exercises, muscle_groups, sets, workout_exercises, workouts

load_dotenv()

_base_url = os.getenv("MCP_BASE_URL", "http://127.0.0.1:8000/mcp")

mcp = FastMCP("Gym Tracker", auth=GymTrackerOAuthProvider(base_url=_base_url))

muscle_groups.register(mcp)
exercises.register(mcp)
workouts.register(mcp)
workout_exercises.register(mcp)
sets.register(mcp)
