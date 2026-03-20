from .base import BaseExercise
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, FeedbackLevel


class Row(BaseExercise):
    name = "row"
    display_name = "Bent-Over Row"
    description = "Hinge at hips, pull weight to chest keeping back straight"

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
        if self.current_stage == "up":
            if angle <= 30:
                return "up"
            elif angle < 50:
                return "middle"
            return "down"
        elif self.current_stage == "down":
            if angle > 150:
                return "down"
            elif angle > 120:
                return "middle"
            return "up"
        else:
            if angle <= 35:
                return "up"
            elif angle > 155:
                return "down"
            return "middle"

    def calculate_accuracy(self, landmarks, frame_width, frame_height):
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        knee_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        wrist_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )

        hip_angle = calculate_angle(shoulder_l, hip_l, knee_l)
        row_angle = calculate_angle(shoulder_l, elbow_l, wrist_l)

        score = 100.0

        if hip_angle < 120:
            score -= (120 - hip_angle) * 0.5

        if row_angle > 30 and self.current_stage == "up":
            score -= (row_angle - 30) * 0.5

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        knee_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )

        hip_angle = calculate_angle(shoulder_l, hip_l, knee_l)

        if hip_angle < 120:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Hinge more at hips"
        elif hip_angle > 160:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Too upright"
        elif self.current_stage == "up":
            return FeedbackLevel.EXCELLENT, "Squeeze at top!"
        return FeedbackLevel.GOOD, "Good row!"

    def get_rep_thresholds(self):
        return {"up": 90.0, "down": 160.0}
