"""
Data Preprocessing Pipeline
==========================
Handles landmark sequence loading, normalization, and augmentation.
"""

import os
import json
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from typing import List, Tuple, Optional, Dict
from pathlib import Path


EXERCISE_TO_IDX = {
    "bicep_curl": 0,
    "pushup": 1,
    "squat": 2,
    "lunge": 3,
    "plank": 4,
    "shoulder_press": 5,
    "row": 6,
    "jumping_jack": 7,
}

IDX_TO_EXERCISE = {v: k for k, v in EXERCISE_TO_IDX.items()}


class LandmarkSequenceDataset(Dataset):
    """
    Dataset for pose landmark sequences.

    Each sample contains:
        - landmarks: (seq_len, 33, 3) array of x, y, z coordinates
        - rep_count: Number of reps in the sequence
        - exercise_type: One-hot encoded exercise type
    """

    def __init__(
        self,
        data_dir: str,
        seq_length: int = 30,
        normalize: bool = True,
        augment: bool = False,
        split: str = "train",
    ):
        self.data_dir = Path(data_dir) / split
        self.seq_length = seq_length
        self.normalize = normalize
        self.augment = augment
        self.split = split

        self.samples = self._load_samples()

    def _load_samples(self) -> List[Dict]:
        """Load all samples from data directory."""
        samples = []

        for exercise_dir in self.data_dir.iterdir():
            if not exercise_dir.is_dir():
                continue

            exercise_name = exercise_dir.name
            exercise_idx = EXERCISE_TO_IDX.get(exercise_name, -1)

            if exercise_idx == -1:
                continue

            for seq_file in exercise_dir.glob("*.npy"):
                samples.append(
                    {
                        "path": str(seq_file),
                        "exercise_idx": exercise_idx,
                        "exercise_name": exercise_name,
                    }
                )

        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]

        # Load sequence
        landmarks = np.load(sample["path"])  # (seq_len, 33, 3) or (N, 33, 3)

        # Load metadata
        meta_path = sample["path"].replace(".npy", "_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
            rep_count = meta.get("rep_count", 1)
        else:
            rep_count = 1

        # Resample to fixed length
        landmarks = self._resample_sequence(landmarks, self.seq_length)

        # Normalize landmarks
        if self.normalize:
            landmarks = self._normalize_landmarks(landmarks)

        # Flatten to (seq_len, 99)
        landmarks = landmarks.reshape(self.seq_length, -1)

        # Data augmentation (training only)
        if self.augment and self.split == "train":
            landmarks = self._augment(landmarks)

        # Create one-hot exercise label
        exercise_label = np.zeros(len(EXERCISE_TO_IDX))
        exercise_label[sample["exercise_idx"]] = 1.0

        return (
            torch.FloatTensor(landmarks),
            torch.FloatTensor([rep_count / 50.0]),  # Normalize reps
            torch.FloatTensor(exercise_label),
        )

    def _resample_sequence(self, seq: np.ndarray, target_len: int) -> np.ndarray:
        """Resample sequence to target length using linear interpolation."""
        if len(seq) == target_len:
            return seq

        indices = np.linspace(0, len(seq) - 1, target_len)
        resampled = np.zeros((target_len, *seq.shape[1:]))

        for i, idx in enumerate(indices):
            lower = int(np.floor(idx))
            upper = min(int(np.ceil(idx)), len(seq) - 1)
            t = idx - lower

            if lower == upper:
                resampled[i] = seq[lower]
            else:
                resampled[i] = (1 - t) * seq[lower] + t * seq[upper]

        return resampled

    def _normalize_landmarks(self, landmarks: np.ndarray) -> np.ndarray:
        """
        Normalize landmarks to be relative to hip center.
        Also scales to consistent range.
        """
        # Calculate hip center (average of left and right hip)
        left_hip = landmarks[:, 23, :]  # Index 23
        right_hip = landmarks[:, 24, :]  # Index 24
        hip_center = (left_hip + right_hip) / 2

        # Center on hip
        normalized = landmarks - hip_center[:, np.newaxis, :]

        # Scale to reasonable range (-1 to 1 based on typical height)
        # Assuming video frame is normalized to 0-1
        # Typical person height is about 0.4-0.5 of frame height
        scale_factor = 2.5  # Normalize to roughly -1 to 1 range
        normalized = normalized * scale_factor

        # Clip extreme values
        normalized = np.clip(normalized, -5, 5)

        return normalized

    def _augment(self, landmarks: np.ndarray) -> np.ndarray:
        """Apply data augmentation."""
        # Random time shift
        if np.random.rand() < 0.3:
            shift = np.random.randint(-3, 4)
            landmarks = np.roll(landmarks, shift, axis=0)

        # Add random noise
        if np.random.rand() < 0.5:
            noise = np.random.randn(*landmarks.shape) * 0.02
            landmarks = landmarks + noise

        # Random scaling
        if np.random.rand() < 0.3:
            scale = np.random.uniform(0.9, 1.1)
            landmarks = landmarks * scale

        return landmarks


def create_dataloaders(
    data_dir: str, batch_size: int = 32, seq_length: int = 30, num_workers: int = 4
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create train, validation, and test dataloaders.
    """
    train_dataset = LandmarkSequenceDataset(
        data_dir, seq_length=seq_length, normalize=True, augment=True, split="train"
    )
    val_dataset = LandmarkSequenceDataset(
        data_dir, seq_length=seq_length, normalize=True, augment=False, split="val"
    )
    test_dataset = LandmarkSequenceDataset(
        data_dir, seq_length=seq_length, normalize=True, augment=False, split="test"
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    return train_loader, val_loader, test_loader


def prepare_landmarks_from_media_pipe(
    landmarks: List, seq_length: int = 30
) -> np.ndarray:
    """
    Convert MediaPipe landmarks to model input format.

    Args:
        landmarks: List of 33 MediaPipe landmarks
        seq_length: Target sequence length

    Returns:
        Normalized landmark sequence (seq_length, 99)
    """
    # Extract x, y, z from MediaPipe landmarks
    coords = np.zeros((len(landmarks), 3))
    for i, lm in enumerate(landmarks):
        coords[i] = [lm.x, lm.y, lm.z]

    # Create sequence (in real-time, this would accumulate frames)
    # For now, assume single frame is repeated
    seq = np.stack([coords] * seq_length, axis=0)

    # Normalize like in dataset
    left_hip = seq[:, 23, :]
    right_hip = seq[:, 24, :]
    hip_center = (left_hip + right_hip) / 2
    seq = seq - hip_center[:, np.newaxis, :]
    seq = seq * 2.5
    seq = np.clip(seq, -5, 5)

    return seq.reshape(seq_length, -1)  # (seq_length, 99)


if __name__ == "__main__":
    # Test dataset
    print("Testing LandmarkSequenceDataset...")

    # Create dummy data for testing
    dummy_dir = Path("ml_model/data/test")
    for exercise in EXERCISE_TO_IDX.keys():
        exercise_dir = dummy_dir / exercise
        exercise_dir.mkdir(parents=True, exist_ok=True)

        # Create dummy sequence
        dummy_seq = np.random.randn(30, 33, 3)
        np.save(exercise_dir / "seq_001.npy", dummy_seq)

        # Create metadata
        meta = {"rep_count": 10, "exercise": exercise}
        with open(exercise_dir / "seq_001_meta.json", "w") as f:
            json.dump(meta, f)

    print(f"Created dummy data in {dummy_dir}")

    # Test loading
    dataset = LandmarkSequenceDataset("ml_model/data", seq_length=30, split="test")
    print(f"Loaded {len(dataset)} samples")

    if len(dataset) > 0:
        landmarks, reps, exercise = dataset[0]
        print(
            f"Sample shapes: landmarks={landmarks.shape}, reps={reps.shape}, exercise={exercise.shape}"
        )
