"""
Real Dataset Extractor
=====================
Extracts pose landmark sequences from real video datasets.
Processes videos using MediaPipe and saves landmark sequences.
"""

import os
import json
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional
import mediapipe as mp
from mediapipe.tasks import python as mp_task
from mediapipe.tasks.python import vision

# Import from parent package
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from exercises import get_exercise, EXERCISE_INFO
from config import FRAME_WIDTH, FRAME_HEIGHT


class VideoProcessor:
    """Process videos and extract pose landmarks."""

    def __init__(self, model_path: str = "pose_landmarker_full.task"):
        base_options = mp_task.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            num_poses=1,
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)
        self.mp_pose = mp.solutions.pose

    def extract_landmarks(self, video_path: str, stride: int = 1) -> tuple:
        """
        Extract pose landmarks from video.

        Args:
            video_path: Path to video file
            stride: Extract every nth frame (1 = all frames)

        Returns:
            Tuple of (landmarks_list, frame_count)
            landmarks_list: List of (33, 3) arrays for each frame
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return [], 0

        landmarks_list = []
        frame_count = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % stride != 0:
                frame_count += 1
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            timestamp_ms = int(frame_count * (1000 / 30))

            results = self.landmarker.detect_for_video(mp_image, timestamp_ms)

            if results.pose_landmarks:
                landmarks = results.pose_landmarks[0]
                coords = np.zeros((33, 3))
                for i, lm in enumerate(landmarks):
                    coords[i] = [lm.x, lm.y, lm.z]
                landmarks_list.append(coords)

            frame_count += 1

        cap.release()
        return landmarks_list, frame_count

    def close(self):
        self.landmarker.close()


class RepCounter:
    """Count reps in a video using rule-based approach."""

    def __init__(self, exercise_name: str):
        self.exercise = get_exercise(exercise_name)
        self.exercise.start()

    def count_reps(
        self, landmarks_list: List[np.ndarray], frame_width: int, frame_height: int
    ) -> int:
        """Count reps from landmark sequence."""
        for landmarks in landmarks_list:
            try:
                self.exercise.process_frame(landmarks, frame_width, frame_height)
            except:
                pass

        return self.exercise.rep_count

    def close(self):
        self.exercise.stop()


def process_pushupbench_dataset(
    videos_dir: str, output_dir: str, metadata_path: str = None, stride: int = 1
):
    """
    Process PushUpBench dataset.

    Download from: https://huggingface.co/datasets/anonymousatom/pushupbench

    Expected structure:
        videos_dir/
            pushup_001.mp4
            pushup_002.mp4
            ...

    Metadata should contain ground truth rep counts.
    """
    output_path = Path(output_dir) / "pushup"
    output_path.mkdir(parents=True, exist_ok=True)

    processor = VideoProcessor()

    # Load ground truth if available
    ground_truth = {}
    if metadata_path and os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            data = json.load(f)
            for item in data:
                video_id = item.get("name", "").replace(".mp4", "")
                counts = item.get("count", [])
                if counts:
                    ground_truth[video_id] = (
                        counts[0] if isinstance(counts[0], int) else 10
                    )

    video_extensions = [".mp4", ".avi", ".mov", ".mkv"]
    video_files = [
        f for f in os.listdir(videos_dir) if Path(f).suffix.lower() in video_extensions
    ]

    print(f"Processing {len(video_files)} videos...")

    for i, video_file in enumerate(video_files, 1):
        video_path = os.path.join(videos_dir, video_file)
        video_id = Path(video_file).stem

        print(f"[{i}/{len(video_files)}] Processing {video_file}...", end=" ")

        # Extract landmarks
        landmarks_list, total_frames = processor.extract_landmarks(video_path, stride)

        if len(landmarks_list) == 0:
            print("FAILED (no landmarks)")
            continue

        # Count reps
        counter = RepCounter("pushup")
        rep_count = counter.count_reps(landmarks_list, FRAME_WIDTH, FRAME_HEIGHT)
        counter.close()

        # Save sequence
        seq_array = np.stack(landmarks_list, axis=0)  # (N, 33, 3)
        np.save(output_path / f"{video_id}.npy", seq_array)

        # Save metadata
        meta = {
            "rep_count": rep_count,
            "ground_truth": ground_truth.get(video_id, rep_count),
            "num_frames": len(landmarks_list),
            "source": "pushupbench",
        }
        with open(output_path / f"{video_id}_meta.json", "w") as f:
            json.dump(meta, f, indent=2)

        print(f"{len(landmarks_list)} frames, {rep_count} reps")

    processor.close()
    print(f"\nSaved to: {output_path}")


def process_single_video(
    video_path: str,
    exercise_name: str,
    output_path: str,
    ground_truth_reps: int = None,
    stride: int = 1,
):
    """
    Process a single video file.

    Usage:
        python -c "
        from ml_model.data_extractor import process_single_video
        process_single_video(
            'path/to/video.mp4',
            'pushup',
            'ml_model/data/train/pushup/video_001',
            ground_truth_reps=15
        )
        "
    """
    processor = VideoProcessor()

    print(f"Extracting landmarks from {video_path}...")
    landmarks_list, total_frames = processor.extract_landmarks(video_path, stride)

    if len(landmarks_list) == 0:
        print("ERROR: No landmarks detected")
        return

    print(f"Found {len(landmarks_list)} frames")

    # Count reps
    counter = RepCounter(exercise_name)
    rep_count = counter.count_reps(landmarks_list, FRAME_WIDTH, FRAME_HEIGHT)
    counter.close()

    print(f"Counted {rep_count} reps")

    # Save sequence
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    seq_array = np.stack(landmarks_list, axis=0)
    np.save(output_file.with_suffix(".npy"), seq_array)

    # Save metadata
    meta = {
        "rep_count": rep_count,
        "ground_truth": ground_truth_reps or rep_count,
        "num_frames": len(landmarks_list),
        "exercise": exercise_name,
        "source": "manual",
    }
    with open(output_file.with_suffix("_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Saved to: {output_file}")
    processor.close()


def create_dataset_from_recordings(
    recordings_dir: str, output_dir: str, split: str = "train"
):
    """
    Process Replicafit recordings into training data.

    Recordings are saved as JSON with landmark data.
    """
    output_path = Path(output_dir) / split
    recordings_path = Path(recordings_dir)

    json_files = list(recordings_path.glob("*.json"))
    print(f"Processing {len(json_files)} recordings...")

    for recording_file in json_files:
        with open(recording_file, "r") as f:
            data = json.load(f)

        exercise_name = data.get("exercise", "unknown")
        exercise_output = output_path / exercise_name
        exercise_output.mkdir(parents=True, exist_ok=True)

        seq_id = recording_file.stem

        # Extract landmarks from frame data
        landmarks_list = []
        for frame in data.get("frame_data", []):
            if frame.get("landmarks"):
                coords = np.zeros((33, 3))
                for i, lm in enumerate(frame["landmarks"]):
                    coords[i] = [lm["x"], lm["y"], lm["z"]]
                landmarks_list.append(coords)

        if len(landmarks_list) == 0:
            continue

        # Get rep count from summary
        summary = data.get("summary", {})
        rep_count = summary.get("total_reps", 0)

        # Save
        seq_array = np.stack(landmarks_list, axis=0)
        np.save(exercise_output / f"{seq_id}.npy", seq_array)

        meta = {
            "rep_count": rep_count,
            "num_frames": len(landmarks_list),
            "source": "recordings",
        }
        with open(exercise_output / f"{seq_id}_meta.json", "w") as f:
            json.dump(meta, f, indent=2)

    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract landmarks from videos")
    parser.add_argument(
        "--mode",
        choices=["pushupbench", "single", "recordings"],
        default="single",
        help="Processing mode",
    )
    parser.add_argument("--video", type=str, help="Video path (for single mode)")
    parser.add_argument("--exercise", type=str, default="pushup", help="Exercise name")
    parser.add_argument(
        "--output", type=str, default="ml_model/data/train", help="Output directory"
    )
    parser.add_argument(
        "--videos_dir", type=str, help="Videos directory (for pushupbench)"
    )
    parser.add_argument("--metadata", type=str, help="Metadata file path")
    parser.add_argument(
        "--recordings_dir", type=str, default="sessions", help="Recordings directory"
    )
    parser.add_argument(
        "--stride", type=int, default=2, help="Frame stride (1=all, 2=half)"
    )

    args = parser.parse_args()

    if args.mode == "pushupbench":
        if not args.videos_dir:
            print("Error: --videos_dir required for pushupbench mode")
            print(
                "Download PushUpBench from: https://huggingface.co/datasets/anonymousatom/pushupbench"
            )
            exit(1)
        process_pushupbench_dataset(
            args.videos_dir, args.output, args.metadata, args.stride
        )
    elif args.mode == "single":
        if not args.video:
            print("Error: --video required for single mode")
            exit(1)
        process_single_video(args.video, args.exercise, args.output, stride=args.stride)
    elif args.mode == "recordings":
        create_dataset_from_recordings(args.recordings_dir, args.output)
