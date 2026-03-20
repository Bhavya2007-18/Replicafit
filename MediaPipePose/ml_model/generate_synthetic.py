"""
Synthetic Data Generator (DEMO ONLY)
===================================
Generates synthetic pose sequences for testing the training pipeline.

WARNING: This is for DEMONSTRATION and TESTING only.
Real models should be trained on REAL data for production use.

Real data sources:
- PushUpBench: https://huggingface.co/datasets/anonymousatom/pushupbench
- MEx Dataset: https://archive.ics.uci.edu/ml/datasets/MEx
- Record your own: python validation/validate.py --record
"""

import os
import json
import numpy as np
from pathlib import Path
from typing import List, Dict
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from exercises import get_exercise
from ml_model.data_processing import EXERCISE_TO_IDX


def generate_synthetic_sequence(
    exercise_name: str,
    num_reps: int = 10,
    seq_length: int = 90,
    noise_level: float = 0.02,
) -> tuple:
    """
    Generate synthetic pose sequence for an exercise.

    This simulates realistic pose movements for testing purposes only.

    Args:
        exercise_name: Name of exercise
        num_reps: Number of reps to simulate
        seq_length: Total sequence length in frames
        noise_level: Amount of random noise to add

    Returns:
        (landmarks, rep_count) tuple
    """
    # Base pose - standing T-pose
    base_pose = np.zeros((33, 3))

    # Head
    base_pose[0] = [0.5, 0.1, 0]  # Nose
    base_pose[1:11] = [
        [0.48, 0.09, 0],
        [0.46, 0.09, 0],
        [0.44, 0.09, 0],  # Eyes
        [0.52, 0.09, 0],
        [0.54, 0.09, 0],
        [0.56, 0.09, 0],
        [0.43, 0.1, 0],
        [0.57, 0.1, 0],  # Ears
        [0.48, 0.11, 0],
        [0.52, 0.11, 0],
    ]  # Mouth

    # Torso
    base_pose[11] = [0.35, 0.3, 0]  # Left shoulder
    base_pose[12] = [0.65, 0.3, 0]  # Right shoulder
    base_pose[13] = [0.25, 0.5, 0]  # Left elbow
    base_pose[14] = [0.75, 0.5, 0]  # Right elbow
    base_pose[15] = [0.2, 0.65, 0]  # Left wrist
    base_pose[16] = [0.8, 0.65, 0]  # Right wrist
    base_pose[17:23] = [[0.18, 0.67, 0]] * 6  # Left hand
    base_pose[17:23] = [[0.18, 0.67, 0]] * 3 + [[0.82, 0.67, 0]] * 3  # Hands

    # Hips and legs
    base_pose[23] = [0.4, 0.55, 0]  # Left hip
    base_pose[24] = [0.6, 0.55, 0]  # Right hip
    base_pose[25] = [0.4, 0.75, 0]  # Left knee
    base_pose[26] = [0.6, 0.75, 0]  # Right knee
    base_pose[27] = [0.4, 0.95, 0]  # Left ankle
    base_pose[28] = [0.6, 0.95, 0]  # Right ankle
    base_pose[29] = [0.38, 0.97, 0]  # Left heel
    base_pose[30] = [0.62, 0.97, 0]  # Right heel
    base_pose[31] = [0.36, 0.98, 0]  # Left foot
    base_pose[32] = [0.64, 0.98, 0]  # Right foot

    # Generate sequence based on exercise
    landmarks_list = []
    frames_per_rep = seq_length // num_reps

    for rep in range(num_reps):
        for frame in range(frames_per_rep):
            pose = base_pose.copy()
            progress = frame / frames_per_rep  # 0 to 1 per rep

            # Apply exercise-specific transformations
            if exercise_name == "bicep_curl":
                # Arm bending
                bend_angle = np.sin(progress * np.pi) * 0.8
                pose[15] = pose[13] + (pose[15] - pose[13]) * np.cos(bend_angle)
                pose[16] = pose[14] + (pose[16] - pose[14]) * np.cos(bend_angle)

            elif exercise_name == "pushup":
                # Body going down and up
                vertical_shift = np.sin(progress * np.pi) * 0.2
                pose[:, 1] += vertical_shift  # Move up/down

            elif exercise_name == "squat":
                # Knees bending
                knee_bend = np.sin(progress * np.pi) * 0.3
                pose[25, 1] -= knee_bend * 0.3
                pose[26, 1] -= knee_bend * 0.3
                pose[27, 1] -= knee_bend * 0.15
                pose[28, 1] -= knee_bend * 0.15

            elif exercise_name == "jumping_jack":
                # Arms up/down and legs out/in
                arm_raise = np.sin(progress * np.pi)
                leg_spread = np.sin(progress * np.pi) * 0.15
                pose[15, 1] = 0.65 - arm_raise * 0.4
                pose[16, 1] = 0.65 - arm_raise * 0.4
                pose[27, 0] = 0.4 - leg_spread
                pose[28, 0] = 0.6 + leg_spread

            elif exercise_name == "lunge":
                # Front knee bending
                knee_bend = np.sin(progress * np.pi) * 0.25
                pose[25, 1] -= knee_bend
                pose[27, 1] -= knee_bend * 0.5

            # Add noise
            noise = np.random.randn(33, 3) * noise_level
            pose = pose + noise

            landmarks_list.append(pose)

    return np.array(landmarks_list), num_reps


def generate_dataset(
    output_dir: str,
    samples_per_exercise: int = 50,
    min_reps: int = 5,
    max_reps: int = 20,
    seq_length: int = 90,
):
    """
    Generate synthetic dataset for demo purposes.

    WARNING: For testing pipeline only, not real training!
    """
    output_path = Path(output_dir)

    # Create splits
    splits = {
        "train": int(samples_per_exercise * 0.7),
        "val": int(samples_per_exercise * 0.15),
        "test": int(samples_per_exercise * 0.15),
    }

    for split, num_samples in splits.items():
        for exercise_name in EXERCISE_TO_IDX.keys():
            exercise_dir = output_path / split / exercise_name
            exercise_dir.mkdir(parents=True, exist_ok=True)

            for i in range(num_samples):
                num_reps = np.random.randint(min_reps, max_reps + 1)

                landmarks, rep_count = generate_synthetic_sequence(
                    exercise_name, num_reps, seq_length
                )

                # Save sequence
                seq_file = exercise_dir / f"syn_{split}_{i:04d}.npy"
                np.save(seq_file, landmarks)

                # Save metadata
                meta_file = exercise_dir / f"syn_{split}_{i:04d}_meta.json"
                meta = {
                    "rep_count": int(rep_count),
                    "num_frames": len(landmarks),
                    "source": "synthetic",
                    "split": split,
                }
                with open(meta_file, "w") as f:
                    json.dump(meta, f, indent=2)

    print(f"Generated synthetic dataset in: {output_path}")
    print(f"  Train: {splits['train']} samples per exercise")
    print(f"  Val: {splits['val']} samples per exercise")
    print(f"  Test: {splits['test']} samples per exercise")
    print("\n" + "=" * 60)
    print("WARNING: This is SYNTHETIC data for DEMO only!")
    print("For real training, use:")
    print("  - PushUpBench: https://huggingface.co/datasets/anonymousatom/pushupbench")
    print("  - Record your own videos")
    print("  - MEx Dataset: https://archive.ics.uci.edu/ml/datasets/MEx")
    print("=" * 60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate synthetic dataset (DEMO)")
    parser.add_argument(
        "--output", type=str, default="ml_model/data", help="Output directory"
    )
    parser.add_argument("--samples", type=int, default=50, help="Samples per exercise")
    parser.add_argument(
        "--min_reps", type=int, default=5, help="Minimum reps per sample"
    )
    parser.add_argument(
        "--max_reps", type=int, default=20, help="Maximum reps per sample"
    )
    parser.add_argument(
        "--seq_length", type=int, default=90, help="Sequence length in frames"
    )

    args = parser.parse_args()

    generate_dataset(
        output_dir=args.output,
        samples_per_exercise=args.samples,
        min_reps=args.min_reps,
        max_reps=args.max_reps,
        seq_length=args.seq_length,
    )
