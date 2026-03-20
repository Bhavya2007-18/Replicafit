from .base import BaseExercise
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, FeedbackLevel


class Squat(BaseExercise):
    name = "squat"
    display_name = "Squat"
    description = "Stand with feet shoulder-width, lower hips as if sitting in a chair"

    def get_primary_angle(self, landmarks, frame_width, frame_height):
        shoulder = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        hip = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        knee = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )
        return calculate_angle(shoulder, hip, knee)

    def get_stage(self, angle, previous_angle):
        if angle > 170:
            return "up"
        elif 90 < angle <= 170:
            return "middle"
        elif angle <= 90:
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

        knee_angle = calculate_angle(hip_l, knee_l, ankle_l)
        hip_angle = calculate_angle(shoulder_l, hip_l, knee_l)

        score = 100.0

        if knee_angle < 80:
            score -= (80 - knee_angle) * 0.5
        if knee_angle > 100 and self.current_stage == "down":
            score -= 10

        if hip_angle < 70:
            score -= (70 - hip_angle) * 0.5

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        hip_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_HIP, frame_width, frame_height
        )
        knee_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_KNEE, frame_width, frame_height
        )
        ankle_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )

        knee_angle = calculate_angle(hip_l, knee_l, ankle_l)

        if knee_angle < 90 and knee_angle > 70:
            return FeedbackLevel.EXCELLENT, "Perfect depth!"
        elif knee_angle >= 90:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Go deeper"
        elif knee_angle < 70:
            return FeedbackLevel.GOOD, "Good depth"
        return FeedbackLevel.GOOD, "Good form!"

    def get_rep_thresholds(self):
        return {"up": 170.0, "down": 90.0}
