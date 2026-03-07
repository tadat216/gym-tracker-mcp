from typing import TypedDict

from sqlmodel import Session

from database import engine, init_db
from services import ExerciseService, MuscleGroupService


class ExerciseSeed(TypedDict):
    name: str
    vn_name: str


class MuscleGroupSeed(TypedDict):
    name: str
    vn_name: str
    exercises: list[ExerciseSeed]

SEED_DATA: list[MuscleGroupSeed] = [
    {
        "name": "Chest",
        "vn_name": "Ngực",
        "exercises": [
            {"name": "Bench Press", "vn_name": "Đẩy ngực"},
            {"name": "Incline Bench Press", "vn_name": "Đẩy ngực nghiêng"},
            {"name": "Cable Fly", "vn_name": "Kéo cáp ngực"},
            {"name": "Push Up", "vn_name": "Chống đẩy"},
            {"name": "Dumbbell Fly", "vn_name": "Mở ngực tạ đơn"},
        ],
    },
    {
        "name": "Back",
        "vn_name": "Lưng",
        "exercises": [
            {"name": "Deadlift", "vn_name": "Kéo đất"},
            {"name": "Barbell Row", "vn_name": "Kéo tạ đòn"},
            {"name": "T-Bar Row", "vn_name": "Kéo T-bar"},
            {"name": "Seated Cable Row", "vn_name": "Kéo cáp ngồi"},
        ],
    },
    {
        "name": "Lats",
        "vn_name": "Lưng rộng",
        "exercises": [
            {"name": "Pull Up", "vn_name": "Xà đơn"},
            {"name": "Lat Pulldown", "vn_name": "Kéo xà xuống"},
            {"name": "Single Arm Row", "vn_name": "Kéo tạ đơn một tay"},
            {"name": "Straight Arm Pulldown", "vn_name": "Kéo thẳng tay xuống"},
        ],
    },
    {
        "name": "Shoulders",
        "vn_name": "Vai",
        "exercises": [
            {"name": "Overhead Press", "vn_name": "Đẩy vai"},
            {"name": "Lateral Raise", "vn_name": "Nâng tạ bên"},
            {"name": "Front Raise", "vn_name": "Nâng tạ trước"},
            {"name": "Rear Delt Fly", "vn_name": "Mở vai sau"},
            {"name": "Arnold Press", "vn_name": "Đẩy Arnold"},
        ],
    },
    {
        "name": "Biceps",
        "vn_name": "Bắp tay trước",
        "exercises": [
            {"name": "Barbell Curl", "vn_name": "Cuộn tạ đòn"},
            {"name": "Dumbbell Curl", "vn_name": "Cuộn tạ đơn"},
            {"name": "Hammer Curl", "vn_name": "Cuộn búa"},
            {"name": "Preacher Curl", "vn_name": "Cuộn bục"},
        ],
    },
    {
        "name": "Triceps",
        "vn_name": "Bắp tay sau",
        "exercises": [
            {"name": "Tricep Dip", "vn_name": "Chống sau"},
            {"name": "Tricep Pushdown", "vn_name": "Đẩy xuống"},
            {"name": "Overhead Tricep Extension", "vn_name": "Duỗi tay sau đầu"},
            {"name": "Close Grip Bench Press", "vn_name": "Đẩy ngực tay hẹp"},
        ],
    },
    {
        "name": "Legs",
        "vn_name": "Chân",
        "exercises": [
            {"name": "Squat", "vn_name": "Ngồi xuống"},
            {"name": "Leg Press", "vn_name": "Đẩy chân"},
            {"name": "Romanian Deadlift", "vn_name": "Kéo đất Romania"},
            {"name": "Leg Curl", "vn_name": "Cuộn chân sau"},
            {"name": "Leg Extension", "vn_name": "Duỗi chân"},
        ],
    },
    {
        "name": "Core",
        "vn_name": "Cơ lõi",
        "exercises": [
            {"name": "Plank", "vn_name": "Plank"},
            {"name": "Crunch", "vn_name": "Gập bụng"},
            {"name": "Leg Raise", "vn_name": "Nâng chân"},
            {"name": "Russian Twist", "vn_name": "Xoắn người"},
        ],
    },
]


def seed() -> None:
    init_db()
    with Session(engine) as session:
        mg_service = MuscleGroupService(session)
        ex_service = ExerciseService(session)

        existing_groups = {mg.name: mg for mg in mg_service.list()}

        for group_data in SEED_DATA:
            if group_data["name"] not in existing_groups:
                mg = mg_service.create(group_data["name"], group_data["vn_name"])
                print(f"Created muscle group: {mg.name}")
            else:
                mg = existing_groups[group_data["name"]]
                print(f"Skipped existing muscle group: {mg.name}")

            existing_exercises = {ex.name for ex in ex_service.list(mg.id)}
            for ex_data in group_data["exercises"]:
                if ex_data["name"] not in existing_exercises:
                    ex = ex_service.create(ex_data["name"], ex_data["vn_name"], mg.id)
                    print(f"  + {ex.name}")
                else:
                    print(f"  ~ {ex_data['name']} (skipped)")


if __name__ == "__main__":
    seed()
