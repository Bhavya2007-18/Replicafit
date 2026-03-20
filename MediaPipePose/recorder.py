import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_task
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import PoseLandmarksConnections
import time
import uuid
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

from exercises import get_exercise, EXERCISE_INFO
from utils import (
    get_feedback_color,
    get_feedback_message,
    FeedbackLevel,
    calculate_angle,
    get_landmark_coords,
    PoseLandmarks,
)
from config import (
    CAMERA_INDEX,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    MIN_DETECTION_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
    RECORDINGS_DIR,
    POSE_MODEL_PATH,
)


POSE_CONNECTIONS = [
    (0, 1),
    (1, 2),
    (2, 3),
    (3, 7),
    (0, 4),
    (4, 5),
    (5, 6),
    (6, 8),
    (9, 10),
    (11, 12),
    (11, 13),
    (13, 15),
    (15, 17),
    (15, 19),
    (15, 21),
    (17, 19),
    (12, 14),
    (14, 16),
    (16, 18),
    (16, 20),
    (16, 22),
    (18, 20),
    (11, 24),
    (12, 23),
    (23, 24),
    (23, 25),
    (25, 27),
    (27, 29),
    (27, 31),
    (29, 31),
    (24, 26),
    (26, 28),
    (28, 30),
    (28, 32),
    (30, 32),
]


def draw_landmarks(
    image: cv2.Mat,
    landmarks,
    connections: List[Tuple[int, int]] = POSE_CONNECTIONS,
    landmark_color: Tuple[int, int, int] = (0, 255, 0),
    connection_color: Tuple[int, int, int] = (255, 255, 0),
    landmark_radius: int = 3,
    connection_thickness: int = 2,
) -> None:
    h, w = image.shape[:2]

    for landmark in landmarks:
        x = int(landmark.x * w)
        y = int(landmark.y * h)
        cv2.circle(image, (x, y), landmark_radius, landmark_color, -1)

    for connection in connections:
        start_idx, end_idx = connection
        if start_idx < len(landmarks) and end_idx < len(landmarks):
            x1 = int(landmarks[start_idx].x * w)
            y1 = int(landmarks[start_idx].y * h)
            x2 = int(landmarks[end_idx].x * w)
            y2 = int(landmarks[end_idx].y * h)
            cv2.line(image, (x1, y1), (x2, y2), connection_color, connection_thickness)


class ExerciseRecorder:
    def __init__(self, exercise_name: str, save_session: bool = True):
        self.exercise_name = exercise_name
        self.exercise = get_exercise(exercise_name)
        self.save_session = save_session
        self.session_id = str(uuid.uuid4())[:8]
        self.start_time = None
        self.is_recording = False
        self.frame_data = []
        self.max_frames_to_store = 300

    def _setup_camera(self):
        cap = cv2.VideoCapture(CAMERA_INDEX)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
        return cap

    def _setup_mediapipe(self):
        base_options = mp_task.BaseOptions(model_asset_path=POSE_MODEL_PATH)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_pose_presence_confidence=MIN_TRACKING_CONFIDENCE,
            num_poses=1,
        )
        return vision.PoseLandmarker.create_from_options(options)

    def _draw_status_box(
        self, frame, rep_count, stage, angle, feedback_level, accuracy
    ):
        height, width = frame.shape[:2]

        cv2.rectangle(frame, (10, 10), (280, 180), (50, 50, 50), -1)
        cv2.rectangle(frame, (10, 10), (280, 180), (100, 100, 100), 2)

        cv2.putText(
            frame, "REPS", (30, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1
        )
        cv2.putText(
            frame,
            str(rep_count),
            (30, 95),
            cv2.FONT_HERSHEY_SIMPLEX,
            2.0,
            (255, 255, 255),
            3,
        )

        cv2.putText(
            frame, "ANGLE", (130, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1
        )
        cv2.putText(
            frame,
            f"{angle:.0f}",
            (130, 95),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.5,
            (255, 255, 255),
            2,
        )

        cv2.putText(
            frame, "STAGE", (30, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1
        )
        cv2.putText(
            frame,
            stage.upper(),
            (30, 160),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
        )

        if accuracy > 0:
            color = (
                (0, 255, 0)
                if accuracy >= 80
                else (0, 255, 255)
                if accuracy >= 60
                else (0, 165, 255)
            )
            cv2.putText(
                frame,
                f"{accuracy:.0f}%",
                (200, 160),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                color,
                2,
            )

    def _draw_feedback(self, frame, feedback_text, feedback_level):
        color = get_feedback_color(feedback_level)
        height, width = frame.shape[:2]

        text_size = cv2.getTextSize(feedback_text, cv2.FONT_HERSHEY_SIMPLEX, 1.0, 2)[0]
        text_x = (width - text_size[0]) // 2

        cv2.rectangle(
            frame,
            (text_x - 20, height - 80),
            (text_x + text_size[0] + 20, height - 30),
            (50, 50, 50),
            -1,
        )
        cv2.putText(
            frame,
            feedback_text,
            (text_x, height - 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            color,
            2,
        )

    def _draw_exercise_info(self, frame):
        info = EXERCISE_INFO.get(self.exercise_name, {})
        cv2.putText(
            frame,
            info.get("name", self.exercise_name),
            (10, frame.shape[0] - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (150, 150, 150),
            1,
        )

    def _draw_recording_indicator(self, frame):
        height, width = frame.shape[:2]

        if self.is_recording:
            elapsed = time.time() - self.start_time if self.start_time else 0
            mins, secs = divmod(int(elapsed), 60)
            time_str = f"{mins:02d}:{secs:02d}"

            cv2.circle(frame, (width - 40, 40), 15, (0, 0, 255), -1)
            cv2.putText(
                frame,
                time_str,
                (width - 75, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
            )

    def record(self, duration: int = None):
        cap = self._setup_camera()
        pose_landmarker = self._setup_mediapipe()

        self.is_recording = True
        self.start_time = time.time()
        paused = False

        print(f"\n{'=' * 50}")
        print(
            f"Recording: {EXERCISE_INFO.get(self.exercise_name, {}).get('name', self.exercise_name)}"
        )
        print(f"Session ID: {self.session_id}")
        print("Press SPACE to pause/resume, Q to quit")
        print(f"{'=' * 50}\n")

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    print("Failed to read frame")
                    break

                frame = cv2.flip(frame, 1)
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                timestamp_ms = int((time.time() - self.start_time) * 1000)
                results = pose_landmarker.detect_for_video(mp_image, timestamp_ms)

                frame_data = {
                    "timestamp": time.time() - self.start_time,
                    "landmarks": None,
                }

                process_result = None

                if results.pose_landmarks:
                    for pose_landmarks in results.pose_landmarks:
                        draw_landmarks(
                            frame,
                            pose_landmarks,
                            connection_color=(0, 255, 255),
                            landmark_color=(0, 255, 0),
                        )

                    if not paused:
                        process_result = self.exercise.process_frame(
                            results.pose_landmarks[0], FRAME_WIDTH, FRAME_HEIGHT
                        )

                        frame_data["landmarks"] = [
                            {
                                "x": lm.x,
                                "y": lm.y,
                                "z": lm.z,
                                "visibility": lm.visibility,
                            }
                            for lm in results.pose_landmarks[0]
                        ]

                        if len(self.frame_data) < self.max_frames_to_store:
                            self.frame_data.append(frame_data)

                if not paused:
                    self._draw_recording_indicator(frame)
                    self._draw_exercise_info(frame)

                    if process_result is not None:
                        self._draw_status_box(
                            frame,
                            process_result["rep_count"],
                            process_result["stage"],
                            process_result["angle"],
                            process_result["feedback"],
                            process_result.get("accuracy", 0),
                        )
                        self._draw_feedback(
                            frame,
                            process_result["feedback_text"],
                            process_result["feedback"],
                        )

                if paused:
                    cv2.putText(
                        frame,
                        "PAUSED",
                        (FRAME_WIDTH // 2 - 80, FRAME_HEIGHT // 2),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1.5,
                        (0, 0, 255),
                        3,
                    )

                cv2.imshow("Replicafit - Exercise Recorder", frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
                elif key == ord(" "):
                    paused = not paused
                    if paused:
                        self.exercise.stop()
                    else:
                        self.exercise.start()

                if duration and (time.time() - self.start_time) >= duration:
                    break

        finally:
            self.is_recording = False
            cap.release()
            cv2.destroyAllWindows()
            pose_landmarker.close()

    def save(self, filepath: str = None):
        if not self.save_session:
            return None

        summary = self.exercise.get_summary()

        session_data = {
            "session_id": self.session_id,
            "timestamp": datetime.now().isoformat(),
            "exercise": self.exercise_name,
            "exercise_name": EXERCISE_INFO.get(self.exercise_name, {}).get(
                "name", self.exercise_name
            ),
            "duration_seconds": time.time() - self.start_time if self.start_time else 0,
            "summary": summary,
            "frame_data": self.frame_data,
        }

        if filepath is None:
            Path(RECORDINGS_DIR).mkdir(exist_ok=True)
            filepath = f"{RECORDINGS_DIR}/{self.session_id}_{self.exercise_name}.json"

        with open(filepath, "w") as f:
            json.dump(session_data, f, indent=2)

        print(f"\nSession saved to: {filepath}")
        return filepath

    def print_summary(self):
        summary = self.exercise.get_summary()
        print(f"\n{'=' * 50}")
        print(f"WORKOUT SUMMARY")
        print(f"{'=' * 50}")
        print(f"Exercise: {summary['display_name']}")
        print(f"Total Reps: {summary['total_reps']}")
        print(f"Average Accuracy: {summary['average_accuracy']:.1f}%")
        print(f"Duration: {summary['duration_seconds']:.1f}s")
        print(f"Reps/Min: {summary['reps_per_minute']:.1f}")
        print(f"{'=' * 50}\n")

        if summary["rep_data"]:
            print("Per-Rep Breakdown:")
            print("-" * 40)
            for rep in summary["rep_data"]:
                status = "✓" if rep["accuracy"] >= 70 else "✗"
                print(
                    f"  Rep {rep['rep_number']}: {rep['accuracy']:.1f}% {status} - {rep['feedback']}"
                )
            print()


def select_exercise():
    print("\nAvailable Exercises:")
    print("-" * 40)

    exercises = list(EXERCISE_INFO.items())
    for i, (key, info) in enumerate(exercises, 1):
        print(f"  {i}. {info['name']} ({info['difficulty']})")
        print(f"     {info['description'][:50]}...")

    print()
    choice = input("Select exercise number: ")

    try:
        idx = int(choice) - 1
        return exercises[idx][0]
    except (ValueError, IndexError):
        print("Invalid selection. Defaulting to squat.")
        return "squat"
