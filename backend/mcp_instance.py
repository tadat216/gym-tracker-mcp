from fastmcp import FastMCP

from tools import exercises, muscle_groups, sets, workout_exercises, workouts

mcp = FastMCP("Gym Tracker")

muscle_groups.register(mcp)
exercises.register(mcp)
workouts.register(mcp)
workout_exercises.register(mcp)
sets.register(mcp)
