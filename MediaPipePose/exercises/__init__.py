from .base import BaseExercise
from .bicep_curl import BicepCurl
from .squat import Squat
from .pushup import Pushup
from .lunge import Lunge
from .plank import Plank
from .shoulder_press import ShoulderPress
from .row import Row
from .jumping_jack import JumpingJack

EXERCISES = {
    "bicep_curl": BicepCurl,
    "squat": Squat,
    "pushup": Pushup,
    "lunge": Lunge,
    "plank": Plank,
    "shoulder_press": ShoulderPress,
    "row": Row,
    "jumping_jack": JumpingJack,
}

EXERCISE_INFO = {
    "bicep_curl": {
        "name": "Bicep Curl",
        "description": "Stand with arms extended, curl weights up by bending elbows",
        "muscles": ["Biceps", "Forearms"],
        "difficulty": "Beginner",
    },
    "squat": {
        "name": "Squat",
        "description": "Stand with feet shoulder-width, lower hips as if sitting in a chair",
        "muscles": ["Quadriceps", "Glutes", "Hamstrings"],
        "difficulty": "Beginner",
    },
    "pushup": {
        "name": "Push-up",
        "description": "Start in plank position, lower chest to ground, push back up",
        "muscles": ["Chest", "Triceps", "Shoulders"],
        "difficulty": "Intermediate",
    },
    "lunge": {
        "name": "Lunge",
        "description": "Step forward, lower back knee toward ground, push back up",
        "muscles": ["Quadriceps", "Glutes", "Hamstrings"],
        "difficulty": "Beginner",
    },
    "plank": {
        "name": "Plank",
        "description": "Hold push-up position with body in straight line",
        "muscles": ["Core", "Shoulders", "Back"],
        "difficulty": "Beginner",
    },
    "shoulder_press": {
        "name": "Shoulder Press",
        "description": "Stand with weights at shoulder level, press overhead",
        "muscles": ["Shoulders", "Triceps"],
        "difficulty": "Intermediate",
    },
    "row": {
        "name": "Bent-Over Row",
        "description": "Hinge at hips, pull weight to chest keeping back straight",
        "muscles": ["Back", "Biceps", "Shoulders"],
        "difficulty": "Intermediate",
    },
    "jumping_jack": {
        "name": "Jumping Jack",
        "description": "Jump while spreading legs and raising arms overhead",
        "muscles": ["Full Body", "Cardio"],
        "difficulty": "Beginner",
    },
}


def get_exercise(name):
    if name in EXERCISES:
        return EXERCISES[name]()
    raise ValueError(f"Unknown exercise: {name}")


def get_all_exercises():
    return [(name, cls()) for name, cls in EXERCISES.items()]


def list_exercises():
    for name, info in EXERCISE_INFO.items():
        print(f"{name}: {info['name']} - {info['difficulty']}")
