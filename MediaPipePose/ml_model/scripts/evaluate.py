#!/usr/bin/env python3
"""
Evaluation Script for Rep Counting Model
=======================================
Evaluates trained model against test data.
"""

import os
import sys
import json
import argparse
import numpy as np
import torch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ml_model.model import RepCountingModel
from ml_model.data_processing import (
    create_dataloaders,
    EXERCISE_TO_IDX,
    IDX_TO_EXERCISE,
)


def evaluate_model(
    checkpoint_path: str,
    data_dir: str,
    batch_size: int = 32,
    seq_length: int = 30,
    device: str = None,
):
    """
    Evaluate trained model on test set.
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device)

    print("=" * 60)
    print("REP COUNTING MODEL EVALUATION")
    print("=" * 60)
    print(f"Device: {device}")
    print(f"Checkpoint: {checkpoint_path}")
    print(f"Data: {data_dir}")
    print("=" * 60)

    # Load model
    model = RepCountingModel(
        input_dim=99,
        hidden_dim=128,
        num_layers=2,
        dropout=0.3,
        num_exercises=len(EXERCISE_TO_IDX),
        bidirectional=True,
    )

    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    print(f"Loaded model from epoch {checkpoint.get('epoch', 'unknown')}")

    # Load test data
    _, _, test_loader = create_dataloaders(data_dir, batch_size, seq_length)
    print(f"Test batches: {len(test_loader)}")

    # Evaluate
    all_preds = []
    all_targets = []
    all_exercise_preds = []
    all_exercise_targets = []

    with torch.no_grad():
        for landmarks, reps, exercise_labels in test_loader:
            landmarks = landmarks.to(device)

            pred_rep, pred_exercise = model(landmarks)

            # Denormalize predictions
            pred_rep = pred_rep.cpu().numpy().flatten() * 50
            target_rep = reps.numpy().flatten() * 50

            pred_exercise_idx = np.argmax(pred_exercise.cpu().numpy(), axis=1)
            target_exercise_idx = np.argmax(exercise_labels.numpy(), axis=1)

            all_preds.extend(pred_rep)
            all_targets.extend(target_rep)
            all_exercise_preds.extend(pred_exercise_idx)
            all_exercise_targets.extend(target_exercise_idx)

    # Calculate metrics
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_exercise_preds = np.array(all_exercise_preds)
    all_exercise_targets = np.array(all_exercise_targets)

    # Rep counting metrics
    mae = np.mean(np.abs(all_preds - all_targets))
    mse = np.mean((all_preds - all_targets) ** 2)
    rmse = np.sqrt(mse)

    # Off-by-one accuracy
    obo = np.mean(np.abs(all_preds - all_targets) <= 1) * 100

    # Exact match
    exact = np.mean(np.abs(all_preds - all_targets) < 0.5) * 100

    # Exercise classification metrics
    exercise_acc = np.mean(all_exercise_preds == all_exercise_targets) * 100

    # Per-exercise metrics
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)

    print(f"\nOverall Rep Counting:")
    print(f"  MAE:  {mae:.2f} reps")
    print(f"  RMSE: {rmse:.2f} reps")
    print(f"  OBO:  {obo:.1f}%")
    print(f"  Exact Match: {exact:.1f}%")

    print(f"\nExercise Classification:")
    print(f"  Accuracy: {exercise_acc:.1f}%")

    # Per-exercise breakdown
    print(f"\nPer-Exercise Rep Counting MAE:")
    for exercise_idx, exercise_name in IDX_TO_EXERCISE.items():
        mask = all_exercise_targets == exercise_idx
        if mask.sum() > 0:
            exercise_mae = np.mean(np.abs(all_preds[mask] - all_targets[mask]))
            print(f"  {exercise_name:15}: {exercise_mae:.2f} reps")

    # Comparison with baseline (rule-based)
    print(f"\nBaseline Comparison (Rule-Based):")
    print(f"  Rule-based MAE (estimated): ~1.5 reps")
    print(f"  ML Model MAE: {mae:.2f} reps")
    improvement = ((1.5 - mae) / 1.5) * 100 if mae < 1.5 else 0
    print(f"  Improvement: {improvement:.1f}%")

    # Save results
    results = {
        "mae": float(mae),
        "rmse": float(rmse),
        "obo_percent": float(obo),
        "exact_match_percent": float(exact),
        "exercise_accuracy": float(exercise_acc),
        "num_samples": len(all_preds),
        "checkpoint": checkpoint_path,
        "data_dir": data_dir,
    }

    results_path = Path("ml_model/results") / "evaluation_results.json"
    results_path.parent.mkdir(parents=True, exist_ok=True)
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to: {results_path}")
    print("=" * 60)

    return results


def main():
    parser = argparse.ArgumentParser(description="Evaluate Rep Counting Model")
    parser.add_argument(
        "--checkpoint",
        type=str,
        default="ml_model/checkpoints/best_model.pt",
        help="Path to model checkpoint",
    )
    parser.add_argument(
        "--data_dir", type=str, default="ml_model/data", help="Path to data directory"
    )
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--seq_length", type=int, default=30, help="Sequence length")
    parser.add_argument("--device", type=str, default=None, help="Device (cuda or cpu)")

    args = parser.parse_args()

    evaluate_model(
        args.checkpoint, args.data_dir, args.batch_size, args.seq_length, args.device
    )


if __name__ == "__main__":
    main()
