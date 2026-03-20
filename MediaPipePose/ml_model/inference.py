"""
Model Inference Wrapper
=======================
Integrates trained ML model with Replicafit's rule-based system.

This provides an ensemble approach:
- Rule-based (hysteresis) for reliability
- ML model for improved accuracy
"""

import numpy as np
import torch
from typing import Dict, List, Optional
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ml_model.model import RepCountingModel
from ml_model.data_processing import IDX_TO_EXERCISE


class MLRepCounter:
    """
    Machine Learning based rep counter.

    Uses BiLSTM model for rep counting from pose sequences.
    """

    def __init__(
        self,
        checkpoint_path: str = "ml_model/checkpoints/best_model.pt",
        seq_length: int = 30,
        device: str = None,
    ):
        self.seq_length = seq_length
        self.sequence_buffer = []

        # Device setup
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)

        # Load model
        self.model = RepCountingModel(
            input_dim=99,
            hidden_dim=128,
            num_layers=2,
            dropout=0.0,  # No dropout during inference
            num_exercises=8,
            bidirectional=True,
        )

        checkpoint_path = Path(checkpoint_path)
        if checkpoint_path.exists():
            checkpoint = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.eval()
            print(f"Loaded ML model from {checkpoint_path}")
        else:
            print(
                f"Warning: Model not found at {checkpoint_path}, ML features disabled"
            )
            self.model = None

        self.model = self.model.to(self.device) if self.model else None

    def _normalize_landmarks(self, landmarks: np.ndarray) -> np.ndarray:
        """Normalize landmarks for model input."""
        # Assume landmarks is (33, 3)
        if landmarks.shape != (33, 3):
            raise ValueError(f"Expected (33, 3), got {landmarks.shape}")

        # Center on hip
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        hip_center = (left_hip + right_hip) / 2
        normalized = landmarks - hip_center

        # Scale
        normalized = normalized * 2.5
        normalized = np.clip(normalized, -5, 5)

        return normalized.flatten()  # (99,)

    def add_frame(self, landmarks: np.ndarray) -> None:
        """Add a frame to the sequence buffer."""
        normalized = self._normalize_landmarks(landmarks)
        self.sequence_buffer.append(normalized)

        # Keep only recent frames
        if len(self.sequence_buffer) > self.seq_length:
            self.sequence_buffer.pop(0)

    def predict(self) -> Dict:
        """
        Predict rep count from current sequence.

        Returns:
            Dict with 'rep_count', 'exercise', 'confidence'
        """
        if self.model is None or len(self.sequence_buffer) < 3:
            return {"rep_count": 0, "exercise": "unknown", "confidence": 0.0}

        # Pad if sequence is shorter than expected
        while len(self.sequence_buffer) < self.seq_length:
            self.sequence_buffer.insert(0, self.sequence_buffer[0])

        # Create input tensor
        sequence = np.stack(self.sequence_buffer[-self.seq_length :], axis=0)
        sequence = torch.FloatTensor(sequence).unsqueeze(0).to(self.device)

        # Predict
        with torch.no_grad():
            rep_out, exercise_out = self.model(sequence)

        rep_count = rep_out.item() * 50  # Denormalize
        exercise_probs = exercise_out.cpu().numpy()[0]
        exercise_idx = np.argmax(exercise_probs)
        exercise_name = IDX_TO_EXERCISE.get(exercise_idx, "unknown")
        confidence = exercise_probs[exercise_idx]

        return {
            "rep_count": round(rep_count),
            "exercise": exercise_name,
            "confidence": float(confidence),
        }

    def reset(self) -> None:
        """Reset sequence buffer."""
        self.sequence_buffer = []


class EnsembleRepCounter:
    """
    Ensemble of rule-based and ML rep counting.

    Combines:
    - Rule-based: Reliable, no ML needed
    - ML-based: Better accuracy for complex movements
    """

    def __init__(
        self,
        rule_based_exercise,
        ml_checkpoint: str = "ml_model/checkpoints/best_model.pt",
        use_ml: bool = True,
    ):
        self.rule_based = rule_based_exercise
        self.use_ml = use_ml

        if use_ml:
            self.ml_counter = MLRepCounter(ml_checkpoint)
        else:
            self.ml_counter = None

    def process_frame(self, landmarks, frame_width: int, frame_height: int) -> Dict:
        """
        Process a frame and return rep count.

        Uses rule-based for primary counting, ML for validation/confidence.
        """
        # Always use rule-based for counting
        result = self.rule_based.process_frame(landmarks, frame_width, frame_height)

        # Optionally enhance with ML
        if self.use_ml and self.ml_counter:
            # Convert landmarks to array
            lm_array = np.zeros((33, 3))
            for i, lm in enumerate(landmarks):
                lm_array[i] = [lm.x, lm.y, lm.z]

            self.ml_counter.add_frame(lm_array)
            ml_prediction = self.ml_counter.predict()

            # Add ML confidence to result
            result["ml_confidence"] = ml_prediction["confidence"]
            result["ml_exercise"] = ml_prediction["exercise"]

            # Average with rule-based for smoother counting
            # (Use this if ML is more confident)
            if ml_prediction["confidence"] > 0.8:
                result["rep_count"] = round(
                    (result["rep_count"] + ml_prediction["rep_count"]) / 2
                )

        return result

    def reset(self) -> None:
        """Reset both counters."""
        self.rule_based.reset()
        if self.ml_counter:
            self.ml_counter.reset()


# Convenience function for quick integration
def create_ensemble_counter(
    exercise_name: str,
    use_ml: bool = True,
    ml_checkpoint: str = "ml_model/checkpoints/best_model.pt",
):
    """
    Create an ensemble rep counter for an exercise.

    Usage:
        counter = create_ensemble_counter("pushup")
        counter.process_frame(landmarks, 640, 480)
    """
    from exercises import get_exercise

    exercise = get_exercise(exercise_name)
    exercise.start()

    return EnsembleRepCounter(
        rule_based_exercise=exercise, ml_checkpoint=ml_checkpoint, use_ml=use_ml
    )
