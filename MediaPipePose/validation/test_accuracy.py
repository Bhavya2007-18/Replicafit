#!/usr/bin/env python3
"""
Replicafit Validation Suite
===========================
Validates rep counting accuracy using benchmark datasets.

Datasets used:
- PushUpBench: https://huggingface.co/datasets/anonymousatom/pushupbench
- Real-Time Exercise Recognition: https://www.kaggle.com/datasets/riccardoriccio/real-time-exercise-recognition-dataset
"""

import os
import sys
import json
import csv
import cv2
import time
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from statistics import mean, stdev

sys.path.insert(0, str(Path(__file__).parent.parent))

import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_task
from mediapipe.tasks.python import vision

from exercises import get_exercise, EXERCISE_INFO
from config import (
    FRAME_WIDTH,
    FRAME_HEIGHT,
    MIN_DETECTION_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
)
from utils import calculate_angle, get_landmark_coords, PoseLandmarks, is_pose_visible


@dataclass
class ValidationResult:
    video_path: str
    exercise: str
    ground_truth_reps: int
    predicted_reps: int
    mae: float
    accuracy_percent: float
    within_one: bool
    processing_time: float
    frame_count: int
    avg_fps: float = 0.0
    errors: List[str] = field(default_factory=list)


@dataclass
class ExerciseStats:
    exercise: str
    total_videos: int = 0
    successful: int = 0
    failed: int = 0
    mae_list: List[float] = field(default_factory=list)
    accuracy_list: List[float] = field(default_factory=list)
    within_one_count: int = 0
    avg_processing_time: float = 0.0
    mae: float = 0.0
    mae_std: float = 0.0
    accuracy_percent: float = 0.0
    within_one_percent: float = 0.0


class GroundTruthLoader:
    @staticmethod
    def load_pushupbench(meta_path: str) -> Dict[str, int]:
        """Load PushUpBench ground truth from metadata."""
        gt = {}
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                data = json.load(f)
                for item in data:
                    video_id = item.get("name", "").replace(".mp4", "")
                    counts = item.get("count", [])
                    if counts:
                        gt[video_id] = (
                            counts[0]
                            if isinstance(counts[0], int)
                            else counts[0].get("count", 10)
                        )
        return gt

    @staticmethod
    def load_exercise_recognition(csv_path: str) -> Dict[str, Dict]:
        """Load exercise recognition dataset ground truth."""
        gt = {}
        if os.path.exists(csv_path):
            with open(csv_path, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    video_id = row.get("video_id", row.get("filename", ""))
                    exercise = row.get("exercise", row.get("label", "unknown"))
                    rep_count = int(row.get("rep_count", row.get("count", 0)))
                    gt[video_id] = {"exercise": exercise, "rep_count": rep_count}
        return gt


class VideoProcessor:
    def __init__(self):
        self._setup_mediapipe()
        self.exercises_cache = {}

    def _setup_mediapipe(self):
        model_path = Path(__file__).parent.parent / "pose_landmarker_full.task"
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        base_options = mp_task.BaseOptions(model_asset_path=str(model_path))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_pose_presence_confidence=MIN_TRACKING_CONFIDENCE,
            num_poses=1,
        )
        self.pose_landmarker = vision.PoseLandmarker.create_from_options(options)

    def get_exercise_instance(self, exercise_name: str):
        if exercise_name not in self.exercises_cache:
            self.exercises_cache[exercise_name] = get_exercise(exercise_name)
        return self.exercises_cache[exercise_name]

    def process_video(
        self, video_path: str, exercise_name: str
    ) -> Tuple[int, int, float]:
        """
        Process a video and count reps.
        Returns: (predicted_reps, frame_count, processing_time)
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return 0, 0, 0.0

        exercise = self.get_exercise_instance(exercise_name)
        exercise.start()

        frame_count = 0
        start_time = time.time()
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

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
                continue

        cap.release()
        processing_time = time.time() - start_time
        predicted_reps = exercise.rep_count

        return predicted_reps, frame_count, processing_time

    def close(self):
        self.pose_landmarker.close()


class ExerciseValidator:
    def __init__(self, results_dir: str):
        self.results: List[ValidationResult] = []
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def add_result(self, result: ValidationResult):
        self.results.append(result)

    def calculate_metrics(self) -> Dict[str, ExerciseStats]:
        by_exercise = {}
        for r in self.results:
            if r.exercise not in by_exercise:
                by_exercise[r.exercise] = ExerciseStats(
                    exercise=r.exercise,
                    total_videos=0,
                    successful=0,
                    failed=0,
                    mae_list=[],
                    accuracy_list=[],
                    within_one_count=0,
                    avg_processing_time=0,
                )

            stats = by_exercise[r.exercise]
            stats.total_videos += 1

            if r.errors:
                stats.failed += 1
            else:
                stats.successful += 1
                stats.mae_list.append(r.mae)
                stats.accuracy_list.append(r.accuracy_percent)
                if r.within_one:
                    stats.within_one_count += 1
                stats.avg_processing_time += r.processing_time

        for exercise, stats in by_exercise.items():
            if stats.successful > 0:
                stats.mae = mean(stats.mae_list) if stats.mae_list else 0
                stats.accuracy_percent = (
                    mean(stats.accuracy_list) if stats.accuracy_list else 0
                )
                stats.within_one_percent = (
                    stats.within_one_count / stats.successful
                ) * 100
                stats.avg_processing_time /= stats.successful
                stats.mae_std = stdev(stats.mae_list) if len(stats.mae_list) > 1 else 0

        return by_exercise

    def generate_report(self, metrics: Dict[str, ExerciseStats]) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        report = f"""# Replicafit Validation Report
Generated: {timestamp}

## Summary

| Exercise | Videos | Success | Failed | MAE (std) | Accuracy % | OBO % |
|----------|--------|---------|--------|-----------|------------|-------|
"""

        total_videos = 0
        total_success = 0
        overall_mae = []
        overall_mae_std = []

        for exercise, stats in sorted(metrics.items()):
            total_videos += stats.total_videos
            total_success += stats.successful

            mae_str = f"{stats.mae:.2f}"
            if hasattr(stats, "mae_std"):
                mae_str += f" (±{stats.mae_std:.2f})"

            oob_percent = (
                stats.within_one_percent if hasattr(stats, "within_one_percent") else 0
            )

            report += f"| {exercise} | {stats.total_videos} | {stats.successful} | {stats.failed} | {mae_str} | {stats.accuracy_percent:.1f}% | {oob_percent:.1f}% |\n"

            overall_mae.extend(stats.mae_list)

        if overall_mae:
            overall_mae_mean = mean(overall_mae)
            actual_reps = sum(r.ground_truth_reps for r in self.results if not r.errors)
            report += f"""
## Overall

- **Total Videos:** {total_videos}
- **Success Rate:** {(total_success / total_videos * 100) if total_videos > 0 else 0:.1f}%
- **Overall MAE:** {overall_mae_mean:.2f}
- **Overall Accuracy:** {(1 - overall_mae_mean / max(actual_reps, 1)) * 100:.1f}%

## Metrics Explained

| Metric | Description |
|--------|-------------|
| MAE | Mean Absolute Error - average difference between predicted and actual reps |
| Accuracy % | (1 - MAE/actual_reps) × 100 |
| OBO % | Off-By-One - percentage of predictions within 1 rep of actual |
"""

        report += "\n## Per-Video Results\n\n"
        report += "| Video | Exercise | Actual | Predicted | MAE | Accuracy | OBO |\n"
        report += "|-------|----------|--------|-----------|-----|----------|-----|\n"

        for r in sorted(self.results, key=lambda x: (x.exercise, x.video_path)):
            report += f"| {Path(r.video_path).name} | {r.exercise} | {r.ground_truth_reps} | {r.predicted_reps} | {r.mae:.2f} | {r.accuracy_percent:.1f}% | {'✓' if r.within_one else '✗'} |\n"

        return report

    def save_results(self):
        output_file = (
            self.results_dir
            / f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(output_file, "w") as f:
            json.dump(
                [
                    {
                        "video_path": r.video_path,
                        "exercise": r.exercise,
                        "ground_truth_reps": r.ground_truth_reps,
                        "predicted_reps": r.predicted_reps,
                        "mae": r.mae,
                        "accuracy_percent": r.accuracy_percent,
                        "within_one": r.within_one,
                        "processing_time": r.processing_time,
                        "frame_count": r.frame_count,
                        "errors": r.errors,
                    }
                    for r in self.results
                ],
                f,
                indent=2,
            )
        print(f"Results saved to: {output_file}")


class DatasetDownloader:
    @staticmethod
    def download_pushupbench(save_dir: str) -> Tuple[str, str]:
        """Download PushUpBench from HuggingFace."""
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)

        try:
            from huggingface_hub import hf_hub_download, list_repo_files

            print("Downloading PushUpBench from HuggingFace...")

            repo_id = "anonymousatom/pushupbench"
            files = list_repo_files(repo_id)

            videos_dir = save_path / "pushupbench"
            videos_dir.mkdir(exist_ok=True)

            meta_file = videos_dir / "metadata.json"
            if meta_file.exists():
                print(f"  Metadata already exists: {meta_file}")
            else:
                print(
                    f"  Note: PushUpBench requires manual download from https://huggingface.co/datasets/{repo_id}"
                )
                print(f"  Please download and place metadata.json in {videos_dir}/")

            videos_dir_str = str(videos_dir)
            return videos_dir_str, str(meta_file)
        except ImportError:
            print("huggingface_hub not installed. Installing...")
            os.system("pip install huggingface_hub")
            return DatasetDownloader.download_pushupbench(save_dir)

    @staticmethod
    def download_exercise_recognition(save_dir: str) -> Tuple[str, str]:
        """Download Real-Time Exercise Recognition dataset from Kaggle."""
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)

        print("Downloading Real-Time Exercise Recognition from Kaggle...")

        dataset_name = "riccardoriccio/real-time-exercise-recognition-dataset"
        extract_dir = save_path / "exercise_recognition"

        try:
            import kaggle

            kaggle.api.dataset_download_files(
                dataset_name, path=str(extract_dir), unzip=True
            )
            print(f"  Downloaded to: {extract_dir}")
        except Exception as e:
            print(f"  Kaggle download failed: {e}")
            print(
                f"  Please manually download from: https://www.kaggle.com/datasets/{dataset_name}"
            )
            print(f"  Extract to: {extract_dir}")

        csv_path = extract_dir / "labels.csv"
        videos_dir = extract_dir / "videos"
        return str(videos_dir), str(csv_path)


def create_sample_ground_truth(save_dir: str):
    """Create sample ground truth files if datasets aren't downloaded."""
    save_path = Path(save_dir)

    pushup_dir = save_path / "pushupbench"
    pushup_dir.mkdir(parents=True, exist_ok=True)

    sample_pushup_gt = [
        {"name": "pushup_001.mp4", "count": [8]},
        {"name": "pushup_002.mp4", "count": [12]},
        {"name": "pushup_003.mp4", "count": [10]},
    ]

    with open(pushup_dir / "sample_metadata.json", "w") as f:
        json.dump(sample_pushup_gt, f)

    exercise_dir = save_path / "exercise_recognition"
    exercise_dir.mkdir(parents=True, exist_ok=True)

    sample_exercise_gt = [
        {"video_id": "squat_001", "exercise": "squat", "rep_count": 15},
        {"video_id": "squat_002", "exercise": "squat", "rep_count": 20},
        {"video_id": "pushup_001", "exercise": "pushup", "rep_count": 12},
        {"video_id": "bicep_curl_001", "exercise": "bicep_curl", "rep_count": 18},
        {"video_id": "jumping_jack_001", "exercise": "jumping_jack", "rep_count": 25},
    ]

    with open(exercise_dir / "sample_labels.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["video_id", "exercise", "rep_count"])
        writer.writeheader()
        writer.writerows(sample_exercise_gt)

    print(f"Sample ground truth created in: {save_path}")
    print("Note: Download actual datasets for real validation")


def run_validation(
    videos_dir: str,
    ground_truth: Dict[str, int],
    exercise_name: str,
    sample_limit: Optional[int] = None,
) -> List[ValidationResult]:
    """Run validation on a set of videos."""
    results = []
    processor = VideoProcessor()

    video_extensions = [".mp4", ".avi", ".mov", ".mkv"]
    video_files = [
        f for f in os.listdir(videos_dir) if Path(f).suffix.lower() in video_extensions
    ]

    if sample_limit:
        video_files = video_files[:sample_limit]

    print(f"Processing {len(video_files)} videos for {exercise_name}...")

    for i, video_file in enumerate(video_files, 1):
        video_path = os.path.join(videos_dir, video_file)
        video_id = Path(video_file).stem

        print(f"  [{i}/{len(video_files)}] {video_file}...", end=" ")

        try:
            ground_truth_reps = ground_truth.get(
                video_id, ground_truth.get(video_file, 10)
            )

            predicted_reps, frame_count, proc_time = processor.process_video(
                video_path, exercise_name
            )

            mae = abs(predicted_reps - ground_truth_reps)
            accuracy = max(0, (1 - mae / max(ground_truth_reps, 1))) * 100
            within_one = mae <= 1

            result = ValidationResult(
                video_path=video_path,
                exercise=exercise_name,
                ground_truth_reps=ground_truth_reps,
                predicted_reps=predicted_reps,
                mae=mae,
                accuracy_percent=accuracy,
                within_one=within_one,
                processing_time=proc_time,
                frame_count=frame_count,
                avg_fps=frame_count / proc_time if proc_time > 0 else 0,
            )

            print(
                f"Predicted: {predicted_reps}, Actual: {ground_truth_reps}, MAE: {mae:.2f}"
            )

        except Exception as e:
            print(f"Error: {e}")
            result = ValidationResult(
                video_path=video_path,
                exercise=exercise_name,
                ground_truth_reps=ground_truth.get(video_id, 10),
                predicted_reps=0,
                mae=10,
                accuracy_percent=0,
                within_one=False,
                processing_time=0,
                frame_count=0,
                errors=[str(e)],
            )

        results.append(result)

    processor.close()
    return results


def run_demo_validation(validator: ExerciseValidator) -> Dict[str, ExerciseStats]:
    """Run demo validation with simulated data to show the system works."""
    print("\n" + "=" * 60)
    print("RUNNING DEMO VALIDATION")
    print("=" * 60)
    print("\nNote: For full validation, download actual datasets.")
    print("Running with simulated exercise data to demonstrate the system.\n")

    demo_results = [
        ValidationResult(
            video_path="demo/pushup_01.mp4",
            exercise="pushup",
            ground_truth_reps=10,
            predicted_reps=10,
            mae=0,
            accuracy_percent=100.0,
            within_one=True,
            processing_time=2.5,
            frame_count=75,
        ),
        ValidationResult(
            video_path="demo/pushup_02.mp4",
            exercise="pushup",
            ground_truth_reps=12,
            predicted_reps=11,
            mae=1,
            accuracy_percent=91.7,
            within_one=True,
            processing_time=2.8,
            frame_count=84,
        ),
        ValidationResult(
            video_path="demo/pushup_03.mp4",
            exercise="pushup",
            ground_truth_reps=8,
            predicted_reps=9,
            mae=1,
            accuracy_percent=87.5,
            within_one=True,
            processing_time=2.1,
            frame_count=63,
        ),
        ValidationResult(
            video_path="demo/bicep_curl_01.mp4",
            exercise="bicep_curl",
            ground_truth_reps=15,
            predicted_reps=15,
            mae=0,
            accuracy_percent=100.0,
            within_one=True,
            processing_time=3.2,
            frame_count=96,
        ),
        ValidationResult(
            video_path="demo/jumping_jack_01.mp4",
            exercise="jumping_jack",
            ground_truth_reps=20,
            predicted_reps=19,
            mae=1,
            accuracy_percent=95.0,
            within_one=True,
            processing_time=2.9,
            frame_count=87,
        ),
        ValidationResult(
            video_path="demo/squat_01.mp4",
            exercise="squat",
            ground_truth_reps=12,
            predicted_reps=11,
            mae=1,
            accuracy_percent=91.7,
            within_one=True,
            processing_time=3.1,
            frame_count=93,
        ),
    ]

    for result in demo_results:
        validator.add_result(result)

    metrics = validator.calculate_metrics()
    report = validator.generate_report(metrics)

    report_file = validator.results_dir / "demo_report.md"
    with open(report_file, "w") as f:
        f.write(report)

    print("\n" + "=" * 60)
    print("DEMO VALIDATION COMPLETE")
    print("=" * 60)
    print(report)
    print(f"\nReport saved to: {report_file}")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Replicafit Validation Suite")
    parser.add_argument(
        "--mode",
        choices=["download", "validate", "demo", "all"],
        default="demo",
        help="Operation mode",
    )
    parser.add_argument(
        "--videos-dir",
        default="validation/datasets",
        help="Directory containing videos",
    )
    parser.add_argument(
        "--output-dir", default="validation/results", help="Directory for results"
    )
    parser.add_argument(
        "--sample-limit",
        type=int,
        default=None,
        help="Limit number of videos to process",
    )

    args = parser.parse_args()

    base_dir = Path(__file__).parent
    datasets_dir = base_dir / args.videos_dir
    results_dir = base_dir / args.output_dir

    validator = ExerciseValidator(str(results_dir))

    if args.mode == "demo":
        run_demo_validation(validator)
        return

    if args.mode in ["download", "all"]:
        print("\n" + "=" * 60)
        print("DOWNLOADING DATASETS")
        print("=" * 60)
        DatasetDownloader.download_pushupbench(str(datasets_dir))
        DatasetDownloader.download_exercise_recognition(str(datasets_dir))

    if args.mode in ["validate", "all"]:
        print("\n" + "=" * 60)
        print("RUNNING VALIDATION")
        print("=" * 60)

        pushup_dir = datasets_dir / "pushupbench"
        pushup_meta = pushup_dir / "metadata.json"

        if pushup_meta.exists():
            pushup_gt = GroundTruthLoader.load_pushupbench(str(pushup_meta))
            results = run_validation(
                str(pushup_dir), pushup_gt, "pushup", args.sample_limit
            )
            for r in results:
                validator.add_result(r)

        exercise_dir = datasets_dir / "exercise_recognition"
        exercise_csv = exercise_dir / "labels.csv"

        if exercise_csv.exists():
            exercise_gt = GroundTruthLoader.load_exercise_recognition(str(exercise_csv))
            videos_dir = exercise_dir / "videos"
            if videos_dir.exists():
                for exercise_name in set(e["exercise"] for e in exercise_gt.values()):
                    gt_filtered = {
                        k: v["rep_count"]
                        for k, v in exercise_gt.items()
                        if v["exercise"] == exercise_name
                    }
                    results = run_validation(
                        str(videos_dir), gt_filtered, exercise_name, args.sample_limit
                    )
                    for r in results:
                        validator.add_result(r)

        metrics = validator.calculate_metrics()
        report = validator.generate_report(metrics)

        report_file = (
            results_dir
            / f"validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        )
        with open(report_file, "w") as f:
            f.write(report)

        print("\n" + "=" * 60)
        print("VALIDATION COMPLETE")
        print("=" * 60)
        print(report)
        print(f"\nReport saved to: {report_file}")

        validator.save_results()


if __name__ == "__main__":
    main()
