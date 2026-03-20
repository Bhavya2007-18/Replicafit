from .base import BaseExercise, RepData
from utils import (
    calculate_angle,
    get_landmark_coords,
    PoseLandmarks,
    FeedbackLevel,
    calculate_distance,
)


class JumpingJack(BaseExercise):
    name = "jumping_jack"
    display_name = "Jumping Jack"
    description = "Jump while spreading legs and raising arms overhead"

    def __init__(self):
        super().__init__()
        self.arms_up = False
        self.legs_out = False
        self._jump_count = 0
        self._was_arms_down = True

    def get_primary_angle(self, landmarks, frame_width, frame_height):
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        wrist_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )
        return calculate_angle(wrist_l, elbow_l, shoulder_l)

    def get_stage(self, angle, previous_angle):
        return "arms_down"

    def get_leg_spread(self, landmarks, frame_width, frame_height):
        left_ankle = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ANKLE, frame_width, frame_height
        )
        right_ankle = get_landmark_coords(
            landmarks, PoseLandmarks.RIGHT_ANKLE, frame_width, frame_height
        )
        left_shoulder = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        right_shoulder = get_landmark_coords(
            landmarks, PoseLandmarks.RIGHT_SHOULDER, frame_width, frame_height
        )

        shoulder_width = calculate_distance(left_shoulder, right_shoulder)
        leg_spread = calculate_distance(left_ankle, right_ankle)

        if shoulder_width > 0:
            return (leg_spread / shoulder_width) * 100
        return 0

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

        arm_angle = calculate_angle(wrist_l, elbow_l, shoulder_l)
        leg_spread_ratio = self.get_leg_spread(landmarks, frame_width, frame_height)

        score = 100.0

        if arm_angle > 90:
            score -= (arm_angle - 90) * 0.3

        if leg_spread_ratio < 100:
            score -= (100 - leg_spread_ratio) * 0.3

        return max(0, min(100, score))

    def get_form_feedback(self, landmarks, frame_width, frame_height):
        elbow_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_ELBOW, frame_width, frame_height
        )
        shoulder_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_SHOULDER, frame_width, frame_height
        )
        wrist_l = get_landmark_coords(
            landmarks, PoseLandmarks.LEFT_WRIST, frame_width, frame_height
        )

        arm_angle = calculate_angle(wrist_l, elbow_l, shoulder_l)
        leg_spread_ratio = self.get_leg_spread(landmarks, frame_width, frame_height)

        if arm_angle < 45 and leg_spread_ratio > 120:
            return FeedbackLevel.EXCELLENT, "Perfect jump!"
        elif arm_angle > 60:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Arms higher"
        elif leg_spread_ratio < 80:
            return FeedbackLevel.NEEDS_IMPROVEMENT, "Wider legs"
        return FeedbackLevel.GOOD, "Good jumping!"

    def get_rep_thresholds(self):
        return {"arms_up": 45.0, "arms_down": 120.0}

    def process_frame(self, landmarks, frame_width, frame_height):
        if not hasattr(landmarks[0], "visibility"):
            return {
                "visible": False,
                "rep_count": self.rep_count,
                "stage": self.current_stage,
                "angle": 0,
                "feedback": FeedbackLevel.ERROR,
                "feedback_text": "Cannot detect pose",
            }

        arm_angle = self.get_primary_angle(landmarks, frame_width, frame_height)
        accuracy = self.calculate_accuracy(landmarks, frame_width, frame_height)
        feedback_level, feedback_text = self.get_form_feedback(
            landmarks, frame_width, frame_height
        )

        is_arms_up = arm_angle < 45
        leg_spread = self.get_leg_spread(landmarks, frame_width, frame_height)
        is_legs_out = leg_spread > 100

        if is_arms_up and is_legs_out and self._was_arms_down:
            self.rep_count += 1
            self._was_arms_down = False
            self._jump_count += 1

            rep_data = RepData(
                rep_number=self.rep_count,
                start_time=self.rep_start_time or 0,
                end_time=0,
                accuracy=accuracy,
                angles={"arm": arm_angle, "leg_spread": leg_spread},
                feedback=feedback_text,
            )
            self.reps_data.append(rep_data)
            self.total_accuracy += accuracy

        if not is_arms_up:
            self._was_arms_down = True

        self.current_stage = "arms_up" if is_arms_up else "arms_down"
        self.last_angle = arm_angle

        return {
            "visible": True,
            "rep_count": self.rep_count,
            "stage": self.current_stage,
            "angle": arm_angle,
            "accuracy": accuracy,
            "feedback": feedback_level,
            "feedback_text": feedback_text,
        }
