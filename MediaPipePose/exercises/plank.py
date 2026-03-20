from .base import BaseExercise
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, FeedbackLevel


class Plank(BaseExercise):
    name = "plank"
    display_name = "Plank"
    description = "Hold push-up position with body in straight line"

    def __init__(self):
        super().__init__()
        self.hold_start_time = None
        self.best_hold_time = 0

    def get_primary_angle(self, landmarks, frame_width, frame_height):
        shoulder = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        hip = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        ankle = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )
        return calculate_angle(shoulder, hip, ankle)

    def get_stage(self, angle, previous_angle):
        if self.current_stage == "up":
            if angle >= 155:
                return "up"
            elif angle >= 145:
                return "good"
            return "dropped"
        elif self.current_stage == "dropped":
            if angle < 125:
                return "dropped"
            elif angle < 135:
                return "good"
            return "up"
        else:
            if angle >= 155:
                return "up"
            elif angle < 130:
                return "dropped"
            return "good"

    def calculate_accuracy(self, landmarks, frame_width, frame_height):
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        ankle_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )

        body_angle = calculate_angle(shoulder_l, hip_l, ankle_l)

        score = 100.0

        if body_angle < 150:
            score -= (150 - body_angle) * 2
        elif 150 <= body_angle < 175:
            score -= 175 - body_angle

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        ankle_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )

        body_angle = calculate_angle(shoulder_l, hip_l, ankle_l)

        if body_angle < 150:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Hips are sagging"
        elif body_angle > 175:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Hips too high"
        elif 165 <= body_angle <= 175:
            return FeedbackLevel.EXCELLENT, "Perfect plank!"
        return FeedbackLevel.GOOD, "Good form!"

    def get_rep_thresholds(self):
        return {"up": 175.0, "good": 160.0}
