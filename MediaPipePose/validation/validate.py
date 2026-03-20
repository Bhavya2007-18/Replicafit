#!/usr/bin/env python3
"""
Replicafit Quick Validation Script
==================================
Run validation with your own videos or sample data.

Usage:
    python validation/validate.py --demo                    # Run demo with simulated data
    python validation/validate.py --videos ./my_videos      # Validate your own videos
    python validation/validate.py --record                  # Record and validate in real-time
"""

import os
import sys
import json
import cv2
import time
import argparse
import mediapipe as mp
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from exercises import get_exercise, EXERCISE_INFO
from config import (
    FRAME_WIDTH,
    FRAME_HEIGHT,
    MIN_DETECTION_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
)
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, is_pose_visible
from recorder import draw_landmarks

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_task
    from mediapipe.tasks.python import vision

    MEDIAPIPE_AVAILABLE = True
except ImportError:
    import mediapipe as mp

    MEDIAPIPE_AVAILABLE = False


class QuickValidator:
    def __init__(self):
        self.results = []
        if MEDIAPIPE_AVAILABLE:
            self._setup_mediapipe()
        else:
            self.pose_landmarker = None
            print("Warning: MediaPipe not available. Using demo mode.")

    def _setup_mediapipe(self):
        model_path = Path(__file__).parent.parent / "pose_landmarker_full.task"
        if not model_path.exists():
            print(f"Warning: Model not found at {model_path}")
            self.pose_landmarker = None
            return

        base_options = mp_task.BaseOptions(model_asset_path=str(model_path))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_pose_presence_confidence=MIN_TRACKING_CONFIDENCE,
            num_poses=1,
        )
        self.pose_landmarker = vision.PoseLandmarker.create_from_options(options)

    def validate_video(
        self, video_path: str, exercise_name: str, expected_reps: int
    ) -> Dict:
        """Validate a single video."""
        result = {
            "video": Path(video_path).name,
            "exercise": exercise_name,
            "expected_reps": expected_reps,
            "predicted_reps": 0,
            "mae": expected_reps,
            "accuracy": 0,
            "within_one": False,
            "status": "skipped",
        }

        if not self.pose_landmarker:
            result["status"] = "mediapipe_unavailable"
            return result

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            result["status"] = "video_error"
            return result

        exercise = get_exercise(exercise_name)
        exercise.start()

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(frame_count * (1000 / 30))

            try:
                results = self.pose_landmarker.detect_for_video(mp_image, timestamp_ms)
                if results.pose_landmarks:
                    exercise.process_frame(
                        results.pose_landmarks[0], FRAME_WIDTH, FRAME_HEIGHT
                    )
            except Exception as e:
                pass

        cap.release()

        predicted = exercise.rep_count
        mae = abs(predicted - expected_reps)
        accuracy = max(0, (1 - mae / max(expected_reps, 1))) * 100

        result.update(
            {
                "predicted_reps": predicted,
                "mae": mae,
                "accuracy": accuracy,
                "within_one": mae <= 1,
                "status": "success",
                "frames_processed": frame_count,
            }
        )

        return result

    def validate_directory(
        self, videos_dir: str, ground_truth: Dict[str, Dict]
    ) -> List[Dict]:
        """Validate all videos in a directory."""
        results = []
        video_exts = [".mp4", ".avi", ".mov", ".mkv", ".webm"]

        for video_file in os.listdir(videos_dir):
            if Path(video_file).suffix.lower() not in video_exts:
                continue

            video_path = os.path.join(videos_dir, video_file)
            video_id = Path(video_file).stem

            if video_id in ground_truth:
                gt = ground_truth[video_id]
                result = self.validate_video(
                    video_path, gt.get("exercise", "squat"), gt.get("rep_count", 10)
                )
            else:
                result = {
                    "video": video_file,
                    "status": "no_ground_truth",
                    "predicted_reps": 0,
                }

            results.append(result)
            print(
                f"  {result['video']}: {result.get('predicted_reps', 'N/A')} reps "
                f"(expected: {result.get('expected_reps', 'N/A')})"
            )

        return results

    def close(self):
        if self.pose_landmarker:
            self.pose_landmarker.close()


def run_demo():
    """Run demo validation with simulated data."""
    print("\n" + "=" * 60)
    print("REPLICAFIT VALIDATION - DEMO MODE")
    print("=" * 60)

    demo_data = [
        {"exercise": "pushup", "expected": 10, "predicted": 10, "status": "success"},
        {"exercise": "pushup", "expected": 12, "predicted": 11, "status": "success"},
        {"exercise": "pushup", "expected": 8, "predicted": 9, "status": "success"},
        {
            "exercise": "bicep_curl",
            "expected": 15,
            "predicted": 15,
            "status": "success",
        },
        {
            "exercise": "bicep_curl",
            "expected": 18,
            "predicted": 17,
            "status": "success",
        },
        {
            "exercise": "jumping_jack",
            "expected": 20,
            "predicted": 19,
            "status": "success",
        },
        {"exercise": "squat", "expected": 12, "predicted": 13, "status": "success"},
    ]

    print("\nSimulated Validation Results:")
    print("-" * 60)

    total_mae = 0
    total_accuracy = 0
    within_one_count = 0

    for d in demo_data:
        mae = abs(d["predicted"] - d["expected"])
        accuracy = max(0, (1 - mae / max(d["expected"], 1))) * 100
        within_one = mae <= 1
        within_one_count += within_one
        total_mae += mae
        total_accuracy += accuracy

        status_icon = "✓" if within_one else "✗"
        print(
            f"  {d['exercise']:15} | Expected: {d['expected']:2} | Predicted: {d['predicted']:2} | "
            f"MAE: {mae:.1f} | Accuracy: {accuracy:.1f}% {status_icon}"
        )

    n = len(demo_data)
    print("-" * 60)
    print(f"\nSummary:")
    print(f"  Total Videos: {n}")
    print(f"  Overall MAE: {total_mae / n:.2f}")
    print(f"  Overall Accuracy: {total_accuracy / n:.1f}%")
    print(f"  Off-By-One Rate: {within_one_count / n * 100:.1f}%")

    print("\n" + "=" * 60)
    print("DEMO COMPLETE")
    print("=" * 60)
    print("\nTo run with real data:")
    print("  1. Create validation/datasets/ground_truth.json")
    print("  2. Add your videos to validation/datasets/videos/")
    print(
        "  3. Run: python validation/validate.py --videos validation/datasets/videos/"
    )


def run_live_test(exercise_name: str):
    """Test exercise tracking in real-time using camera."""
    print("\n" + "=" * 60)
    print(f"LIVE TEST: {exercise_name}")
    print("=" * 60)
    print("Perform the exercise and count your reps!")
    print("Press 'q' to quit and see results.\n")

    if not MEDIAPIPE_AVAILABLE:
        print("Error: MediaPipe not available")
        return

    model_path = Path(__file__).parent.parent / "pose_landmarker_full.task"
    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        return

    base_options = mp_task.BaseOptions(model_asset_path=str(model_path))
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=MIN_DETECTION_CONFIDENCE,
        min_pose_presence_confidence=MIN_TRACKING_CONFIDENCE,
        num_poses=1,
    )
    pose_landmarker = vision.PoseLandmarker.create_from_options(options)

    exercise = get_exercise(exercise_name)
    exercise.start()

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    start_time = time.time()
    frame_count = 0

    print("Recording... (press 'q' to stop)")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(time.time() * 1000)

            results = pose_landmarker.detect_for_video(mp_image, timestamp_ms)
            frame_count += 1

            if results.pose_landmarks:
                draw_landmarks(frame, results.pose_landmarks[0])
                process_result = exercise.process_frame(
                    results.pose_landmarks[0], FRAME_WIDTH, FRAME_HEIGHT
                )

                cv2.putText(
                    frame,
                    f"REPS: {process_result['rep_count']}",
                    (50, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.5,
                    (0, 255, 0),
                    3,
                )
                cv2.putText(
                    frame,
                    f"STAGE: {process_result['stage']}",
                    (50, 130),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (255, 255, 255),
                    2,
                )
                cv2.putText(
                    frame,
                    f"ANGLE: {process_result['angle']:.0f}",
                    (50, 170),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (255, 255, 255),
                    2,
                )

            elapsed = time.time() - start_time
            cv2.putText(
                frame,
                f"TIME: {int(elapsed)}s",
                (FRAME_WIDTH - 150, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (255, 255, 255),
                2,
            )

            cv2.imshow("Replicafit Live Test", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()
        pose_landmarker.close()

    summary = exercise.get_summary()
    print("\n" + "=" * 60)
    print("LIVE TEST RESULTS")
    print("=" * 60)
    print(f"Exercise: {summary['display_name']}")
    print(f"Total Reps: {summary['total_reps']}")
    print(f"Duration: {summary['duration_seconds']:.1f}s")
    print(f"Reps/Min: {summary['reps_per_minute']:.1f}")
    print(f"Avg Accuracy: {summary['average_accuracy']:.1f}%")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Replicafit Validation")
    parser.add_argument("--demo", action="store_true", help="Run demo validation")
    parser.add_argument(
        "--live", type=str, help="Live test with camera (exercise name)"
    )
    parser.add_argument("--videos", type=str, help="Validate videos in directory")

    args = parser.parse_args()

    if args.live:
        run_live_test(args.live)
    elif args.videos:
        gt_file = Path(args.videos).parent / "ground_truth.json"
        ground_truth = {}
        if gt_file.exists():
            with open(gt_file) as f:
                ground_truth = json.load(f)

        validator = QuickValidator()
        results = validator.validate_directory(args.videos, ground_truth)
        validator.close()

        output_file = (
            Path("validation/results")
            / f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        output_file.parent.mkdir(exist_ok=True)
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to: {output_file}")
    else:
        run_demo()


if __name__ == "__main__":
    main()
