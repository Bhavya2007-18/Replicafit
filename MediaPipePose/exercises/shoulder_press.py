from .base import BaseExercise
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, FeedbackLevel


class ShoulderPress(BaseExercise):
    name = "shoulder_press"
    display_name = "Shoulder Press"
    description = "Stand with weights at shoulder level, press overhead"

    def get_primary_angle(self, landmarks, frame_width, frame_height):
        elbow = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        shoulder = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        wrist = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )
        return calculate_angle(wrist, elbow, shoulder)

    def get_stage(self, angle, previous_angle):
        if angle > 160:
            return "up"
        elif 90 < angle <= 160:
            return "middle"
        elif angle <= 90:
            return "down"
        return "middle"

    def calculate_accuracy(self, landmarks, frame_width, frame_height):
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        wrist_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )

        press_angle = calculate_angle(wrist_l, elbow_l, shoulder_l)
        back_lean = calculate_angle(shoulder_l, hip_l, elbow_l)

        score = 100.0

        if press_angle < 170 and self.current_stage == "up":
            score -= (170 - press_angle) * 0.5

        if back_lean < 170:
            score -= (170 - back_lean) * 0.5

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )

        back_lean = calculate_angle(shoulder_l, hip_l, elbow_l)

        if back_lean < 165:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Don't lean back"
        elif self.current_stage == "up":
            return FeedbackLevel.EXCELLENT, "Full extension!"
        return FeedbackLevel.GOOD, "Good press!"

    def get_rep_thresholds(self):
        return {"up": 160.0, "down": 90.0}
