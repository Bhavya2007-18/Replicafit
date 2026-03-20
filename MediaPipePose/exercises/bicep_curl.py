from .base import BaseExercise, RepData
from utils import (
    calculate_angle,
    get_landmark_coords,
    PoseLandmarks,
    FeedbackLevel,
    calculate_distance,
)


class BicepCurl(BaseExercise):
    name = "bicep_curl"
    display_name = "Bicep Curl"
    description = "Stand with arms extended, curl weights up by bending elbows"

    def get_primary_angle(self, landmarks, frame_width, frame_height):
        shoulder = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        elbow = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        wrist = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )
        return calculate_angle(shoulder, elbow, wrist)

    def get_stage(self, angle, previous_angle):
        if angle > 160:
            return "down"
        elif 30 < angle < 160:
            return "middle"
        elif angle <= 30:
            return "up"
        return "middle"

    def calculate_accuracy(self, landmarks, frame_width, frame_height):
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        wrist_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )

        elbow_angle = calculate_angle(shoulder_l, elbow_l, wrist_l)
        back_angle = calculate_angle(shoulder_l, elbow_l, hip_l)

        score = 100.0

        if elbow_angle < 160 and elbow_angle > 100:
            score -= 15
        elif elbow_angle >= 160:
            score -= 5

        if back_angle < 150:
            score -= (150 - back_angle) * 0.5

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        wrist_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )

        elbow_angle = calculate_angle(shoulder_l, elbow_l, wrist_l)
        back_angle = calculate_angle(shoulder_l, elbow_l, hip_l)

        if back_angle < 160:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Keep your back straight"
        elif self.current_stage == "up" and elbow_angle > 30:
            return FeedbackLevel.GOOD, "Squeeze at the top"
        elif self.current_stage == "down" and elbow_angle < 160:
            return FeedbackLevel.GOOD, "Full extension"
        elif self.last_rep_was_good:
            return FeedbackLevel.EXCELLENT, "Great form!"
        return FeedbackLevel.GOOD, "Good job!"

    def get_rep_thresholds(self):
        return {"up": 30.0, "down": 160.0}
