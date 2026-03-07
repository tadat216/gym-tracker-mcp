import os

from fastmcp import FastMCP

from database import init_db
from tools import exercises, muscle_groups, sets, workout_exercises, workouts

mcp = FastMCP("Gym Tracker")

init_db()

muscle_groups.register(mcp)
exercises.register(mcp)
workouts.register(mcp)
workout_exercises.register(mcp)
sets.register(mcp)

if __name__ == "__main__":
    host = os.getenv("MCP_HOST", "127.0.0.1")
    port = int(os.getenv("MCP_PORT", "8000"))
    mcp.run(transport="streamable-http", host=host, port=port)
