import numpy as np
from enum import Enum


class ExerciseState(Enum):
    IDLE = "idle"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class FeedbackLevel(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    NEEDS_IMPROVEMENT = "needs_improvement"
    ERROR = "error"


class PoseLandmarks:
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32


def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(
        a[1] - b[1], a[0] - b[0]
    )
    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle


def calculate_distance(a, b):
    return np.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def get_landmark_coords(landmarks, idx, frame_width, frame_height):
    landmark = landmarks[idx]
    return [landmark.x * frame_width, landmark.y * frame_height]


def get_landmark_visibility(landmarks, idx):
    return landmarks[idx].visibility


def is_pose_visible(landmarks, min_visibility=0.5):
    key_points = [
        PoseLandmarks.LEFT_SHOULDER,
        PoseLandmarks.RIGHT_SHOULDER,
        PoseLandmarks.LEFT_HIP,
        PoseLandmarks.RIGHT_HIP,
        PoseLandmarks.LEFT_KNEE,
        PoseLandmarks.RIGHT_KNEE,
    ]
    return all(
        get_landmark_visibility(landmarks, p) > min_visibility for p in key_points
    )


def normalize_angle(angle):
    return min(angle, 360 - angle)


def get_reps_per_minute(rep_count, elapsed_seconds):
    if elapsed_seconds == 0:
        return 0
    return (rep_count / elapsed_seconds) * 60


def get_feedback_color(feedback):
    colors = {
        FeedbackLevel.EXCELLENT: (0, 255, 0),
        FeedbackLevel.GOOD: (0, 255, 255),
        FeedbackLevel.NEEDS_IMPROVEMENT: (0, 165, 255),
        FeedbackLevel.ERROR: (0, 0, 255),
    }
    return colors.get(feedback, (255, 255, 255))


def get_feedback_message(feedback):
    messages = {
        FeedbackLevel.EXCELLENT: "Perfect form!",
        FeedbackLevel.GOOD: "Good job!",
        FeedbackLevel.NEEDS_IMPROVEMENT: "Adjust your form",
        FeedbackLevel.ERROR: "Cannot detect pose",
    }
    return messages.get(feedback, "")
