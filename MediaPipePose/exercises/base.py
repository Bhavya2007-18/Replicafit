from abc import ABC, abstractmethod
from enum import Enum
import time
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple

from utils import (
    calculate_angle,
    get_landmark_coords,
    get_landmark_visibility,
    PoseLandmarks,
    FeedbackLevel,
    is_pose_visible,
)


@dataclass
class RepData:
    rep_number: int
    start_time: float
    end_time: float
    accuracy: float
    angles: Dict[str, float] = field(default_factory=dict)
    feedback: str = ""

    @property
    def duration_ms(self) -> float:
        return (self.end_time - self.start_time) * 1000


class BaseExercise(ABC):
    name: str = "base_exercise"
    display_name: str = "Exercise"
    description: str = ""

    def __init__(self):
        self.rep_count = 0
        self.current_stage = "idle"
        self.reps_data: List[RepData] = []
        self.total_accuracy = 0.0
        self.start_time = None
        self.last_angle = 0.0
        self.is_active = False
        self.rep_start_time = None
        self.frame_count = 0
        self.last_rep_was_good = True
        self.angle_buffer: List[float] = []
        self.buffer_size: int = 5
        self.smoothed_angle: float = 0.0

    @abstractmethod
    def get_primary_angle(
        self, landmarks, frame_width: int, frame_height: int
    ) -> float:
        pass

    @abstractmethod
    def get_stage(self, angle: float, previous_angle: float) -> str:
        pass

    @abstractmethod
    def calculate_accuracy(
        self, landmarks, frame_width: int, frame_height: int
    ) -> float:
        pass

    @abstractmethod
    def get_form_feedback(
        self, landmarks, frame_width: int, frame_height: int
    ) -> Tuple[FeedbackLevel, str]:
        pass

    @abstractmethod
    def get_rep_thresholds(self) -> Dict[str, float]:
        pass

    def get_angle_name(self) -> str:
        return "Angle"

    def get_side(self) -> str:
        return "primary"

    def _smooth_angle(self, raw_angle: float) -> float:
        self.angle_buffer.append(raw_angle)
        if len(self.angle_buffer) > self.buffer_size:
            self.angle_buffer.pop(0)
        return sum(self.angle_buffer) / len(self.angle_buffer)

    def process_frame(self, landmarks, frame_width: int, frame_height: int) -> Dict:
        if not is_pose_visible(landmarks):
            return {
                "visible": False,
                "rep_count": self.rep_count,
                "stage": self.current_stage,
                "angle": 0,
                "feedback": FeedbackLevel.ERROR,
                "feedback_text": "Cannot detect pose",
            }

        raw_angle = self.get_primary_angle(landmarks, frame_width, frame_height)
        angle = self._smooth_angle(raw_angle)
        previous_angle = self.last_angle
        new_stage = self.get_stage(angle, previous_angle)
        self.last_angle = angle

        accuracy = self.calculate_accuracy(landmarks, frame_width, frame_height)
        feedback_level, feedback_text = self.get_form_feedback(
            landmarks, frame_width, frame_height
        )

        if new_stage != self.current_stage:
            if new_stage == "up" and self.current_stage in ["down", "middle"]:
                self.rep_count += 1
                rep_data = RepData(
                    rep_number=self.rep_count,
                    start_time=self.rep_start_time or time.time(),
                    end_time=time.time(),
                    accuracy=accuracy,
                    angles={"primary": angle},
                    feedback=feedback_text,
                )
                self.reps_data.append(rep_data)
                self.total_accuracy += accuracy
                self.rep_start_time = None
                self.last_rep_was_good = accuracy >= 70.0
            elif new_stage in ["start", "down"]:
                if self.rep_start_time is None:
                    self.rep_start_time = time.time()

        self.current_stage = new_stage
        self.frame_count += 1

        return {
            "visible": True,
            "rep_count": self.rep_count,
            "stage": self.current_stage,
            "angle": angle,
            "accuracy": accuracy,
            "feedback": feedback_level,
            "feedback_text": feedback_text,
        }

    def start(self):
        self.is_active = True
        self.start_time = time.time()
        self.rep_count = 0
        self.reps_data = []
        self.total_accuracy = 0
        self.current_stage = "idle"
        self.last_angle = 0
        self.frame_count = 0
        self.angle_buffer = []
        self.smoothed_angle = 0.0

    def stop(self):
        self.is_active = False

    def get_summary(self) -> Dict:
        avg_accuracy = self.total_accuracy / self.rep_count if self.rep_count > 0 else 0
        duration = time.time() - self.start_time if self.start_time else 0

        return {
            "exercise": self.name,
            "display_name": self.display_name,
            "total_reps": self.rep_count,
            "average_accuracy": round(avg_accuracy, 1),
            "duration_seconds": round(duration, 1),
            "reps_per_minute": round((self.rep_count / duration) * 60, 1)
            if duration > 0
            else 0,
            "rep_data": [
                {
                    "rep_number": r.rep_number,
                    "accuracy": r.accuracy,
                    "duration_ms": round(r.duration_ms, 1),
                    "feedback": r.feedback,
                }
                for r in self.reps_data
            ],
        }

    def reset(self):
        self.__init__()
