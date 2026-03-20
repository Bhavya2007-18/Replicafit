from .base import BaseExercise
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, FeedbackLevel


class Lunge(BaseExercise):
    name = "lunge"
    display_name = "Lunge"
    description = "Step forward, lower back knee toward ground, push back up"

    def __init__(self):
        super().__init__()
        self.hold_start_time = None
        self.hold_duration = 0

    def get_primary_angle(self, landmarks, frame_width, frame_height):
        hip = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        knee = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )
        ankle = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )
        return calculate_angle(hip, knee, ankle)

    def get_stage(self, angle, previous_angle):
        if self.current_stage == "up":
            if angle > 155:
                return "up"
            elif angle > 130:
                return "middle"
            return "down"
        elif self.current_stage == "down":
            if angle <= 90:
                return "down"
            elif angle < 110:
                return "middle"
            return "up"
        else:
            if angle > 150:
                return "up"
            elif angle <= 85:
                return "down"
            return "middle"

    def calculate_accuracy(self, landmarks, frame_width, frame_height):
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        knee_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )
        ankle_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )

        front_knee_angle = calculate_angle(hip_l, knee_l, ankle_l)
        torso_angle = calculate_angle(hip_l, knee_l, shoulder_l)

        score = 100.0

        if front_knee_angle < 85 or front_knee_angle > 100:
            score -= 10

        if torso_angle < 150:
            score -= (150 - torso_angle) * 0.5

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        knee_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )
        ankle_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )

        front_knee_angle = calculate_angle(hip_l, knee_l, ankle_l)

        if self.current_stage == "down":
            if front_knee_angle > 95:
                return FeedbackLevel.NEEDS_IMPROVEMENT, "Front knee past ankle"
            elif front_knee_angle < 80:
                return FeedbackLevel.GOOD, "Good depth"
            return FeedbackLevel.EXCELLENT, "Perfect lunge!"
        elif self.current_stage == "up":
            return FeedbackLevel.GOOD, "Full extension"
        return FeedbackLevel.GOOD, "Good form!"

    def get_rep_thresholds(self):
        return {"up": 165.0, "down": 80.0}
