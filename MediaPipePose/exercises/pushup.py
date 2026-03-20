from .base import BaseExercise
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, FeedbackLevel


class Pushup(BaseExercise):
    name = "pushup"
    display_name = "Push-up"
    description = "Start in plank position, lower chest to ground, push back up"

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
        if angle > 170:
            return "up"
        elif 90 < angle <= 170:
            return "middle"
        elif angle <= 90:
            return "down"
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
        ankle_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )

        elbow_angle = calculate_angle(shoulder_l, elbow_l, wrist_l)
        body_angle = calculate_angle(shoulder_l, hip_l, ankle_l)

        score = 100.0

        if body_angle < 160:
            score -= (160 - body_angle) * 0.5

        if elbow_angle < 90:
            score -= (90 - elbow_angle) * 0.3

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

        if body_angle < 165:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Keep body straight"
        elif self.current_stage == "down":
            return FeedbackLevel.GOOD, "Full extension"
        return FeedbackLevel.EXCELLENT, "Perfect form!"

    def get_rep_thresholds(self):
        return {"up": 170.0, "down": 90.0}
