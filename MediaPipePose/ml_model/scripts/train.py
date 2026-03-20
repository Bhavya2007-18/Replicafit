#!/usr/bin/env python3
"""
Training Script for Rep Counting Model
=====================================
Trains BiLSTM model for exercise rep counting.
"""

import os
import sys
import json
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml_model.model import RepCountingModel, count_parameters, get_model_summary
from ml_model.data_processing import create_dataloaders, EXERCISE_TO_IDX


class RepCountLoss(nn.Module):
    """
    Combined loss for rep counting (multi-task learning).
    - Rep count regression (MSE)
    - Exercise classification (CE)
    """

    def __init__(self, rep_weight: float = 1.0, exercise_weight: float = 0.3):
        super().__init__()
        self.rep_weight = rep_weight
        self.exercise_weight = exercise_weight
        self.rep_loss = nn.MSELoss()
        self.exercise_loss = nn.CrossEntropyLoss()

    def forward(self, pred_rep, pred_exercise, target_rep, target_exercise):
        rep_loss = self.rep_loss(pred_rep, target_rep)
        # Convert one-hot to class indices
        target_classes = torch.argmax(target_exercise, dim=1)
        exercise_loss = self.exercise_loss(pred_exercise, target_classes)

        total_loss = self.rep_weight * rep_loss + self.exercise_weight * exercise_loss

        return total_loss, rep_loss, exercise_loss


def train_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: RepCountLoss,
    optimizer: optim.Optimizer,
    device: torch.device,
    epoch: int,
) -> dict:
    """Train for one epoch."""
    model.train()

    total_loss = 0
    total_rep_loss = 0
    total_exercise_loss = 0
    num_batches = 0

    for batch_idx, (landmarks, reps, exercise) in enumerate(dataloader):
        landmarks = landmarks.to(device)
        reps = reps.to(device)
        exercise = exercise.to(device)

        optimizer.zero_grad()

        pred_rep, pred_exercise = model(landmarks)
        loss, rep_loss, exercise_loss = criterion(
            pred_rep, pred_exercise, reps, exercise
        )

        loss.backward()

        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        optimizer.step()

        total_loss += loss.item()
        total_rep_loss += rep_loss.item()
        total_exercise_loss += exercise_loss.item()
        num_batches += 1

        if batch_idx % 10 == 0:
            print(f"  Batch {batch_idx}/{len(dataloader)}: Loss={loss.item():.4f}")

    avg_loss = total_loss / num_batches
    avg_rep_loss = total_rep_loss / num_batches
    avg_exercise_loss = total_exercise_loss / num_batches

    return {
        "loss": avg_loss,
        "rep_loss": avg_rep_loss,
        "exercise_loss": avg_exercise_loss,
    }


def validate(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: RepCountLoss,
    device: torch.device,
) -> dict:
    """Validate model."""
    model.eval()

    total_loss = 0
    total_rep_loss = 0
    num_batches = 0

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for landmarks, reps, exercise in dataloader:
            landmarks = landmarks.to(device)
            reps = reps.to(device)
            exercise = exercise.to(device)

            pred_rep, pred_exercise = model(landmarks)
            loss, rep_loss, _ = criterion(pred_rep, pred_exercise, reps, exercise)

            total_loss += loss.item()
            total_rep_loss += rep_loss.item()
            num_batches += 1

            all_preds.extend(pred_rep.cpu().numpy().flatten())
            all_targets.extend(reps.cpu().numpy().flatten())

    # Calculate metrics
    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    mae = np.mean(np.abs(all_preds * 50 - all_targets * 50))  # Denormalize

    return {
        "loss": total_loss / num_batches,
        "rep_loss": total_rep_loss / num_batches,
        "mae": mae,
    }


def train(
    data_dir: str,
    epochs: int = 50,
    batch_size: int = 32,
    learning_rate: float = 0.001,
    seq_length: int = 30,
    checkpoint_dir: str = "ml_model/checkpoints",
    device: str = None,
):
    """
    Main training loop.
    """
    # Device setup
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device)

    print("=" * 60)
    print("REP COUNTING MODEL TRAINING")
    print("=" * 60)
    print(f"Device: {device}")
    print(f"Data directory: {data_dir}")
    print(f"Epochs: {epochs}")
    print(f"Batch size: {batch_size}")
    print(f"Sequence length: {seq_length}")
    print("=" * 60)

    # Create checkpoint directory
    checkpoint_dir = Path(checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    # Create dataloaders
    try:
        train_loader, val_loader, test_loader = create_dataloaders(
            data_dir, batch_size, seq_length
        )
        print(f"Train batches: {len(train_loader)}")
        print(f"Val batches: {len(val_loader)}")
    except Exception as e:
        print(f"Warning: Could not load data: {e}")
        print("Will generate synthetic data for demo...")
        return

    # Create model
    model = RepCountingModel(
        input_dim=99,
        hidden_dim=128,
        num_layers=2,
        dropout=0.3,
        num_exercises=len(EXERCISE_TO_IDX),
        bidirectional=True,
    )
    model = model.to(device)

    summary = get_model_summary(model, (seq_length, 99))
    print(f"\nModel Parameters: {summary['total_parameters']:,}")
    print(f"Model Size: ~{summary['model_size_mb']:.2f} MB")

    # Loss and optimizer
    criterion = RepCountLoss(rep_weight=1.0, exercise_weight=0.3)
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=5, verbose=True
    )

    # Training loop
    best_val_loss = float("inf")
    training_history = []

    print("\nStarting training...\n")

    for epoch in range(epochs):
        print(f"Epoch {epoch + 1}/{epochs}")
        print("-" * 40)

        # Train
        train_metrics = train_epoch(
            model, train_loader, criterion, optimizer, device, epoch
        )
        print(
            f"Train Loss: {train_metrics['loss']:.4f} | "
            f"Rep Loss: {train_metrics['rep_loss']:.4f}"
        )

        # Validate
        val_metrics = validate(model, val_loader, criterion, device)
        print(
            f"Val Loss: {val_metrics['loss']:.4f} | "
            f"Val MAE: {val_metrics['mae']:.2f} reps"
        )

        # Learning rate scheduling
        scheduler.step(val_metrics["loss"])

        # Save checkpoint
        training_history.append(
            {
                "epoch": epoch + 1,
                "train_loss": train_metrics["loss"],
                "val_loss": val_metrics["loss"],
                "val_mae": val_metrics["mae"],
            }
        )

        if val_metrics["loss"] < best_val_loss:
            best_val_loss = val_metrics["loss"]
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_loss": val_metrics["loss"],
                    "val_mae": val_metrics["mae"],
                },
                checkpoint_dir / "best_model.pt",
            )
            print(f"  ✓ Saved best model (val_loss={best_val_loss:.4f})")

        # Save periodic checkpoint
        if (epoch + 1) % 10 == 0:
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                },
                checkpoint_dir / f"checkpoint_epoch_{epoch + 1}.pt",
            )

        print()

    # Save final model
    torch.save(
        {"model_state_dict": model.state_dict(), "exercise_to_idx": EXERCISE_TO_IDX},
        checkpoint_dir / "final_model.pt",
    )

    # Save training history
    with open(checkpoint_dir / "training_history.json", "w") as f:
        json.dump(training_history, f, indent=2)

    print("=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"Best validation loss: {best_val_loss:.4f}")
    print(f"Models saved to: {checkpoint_dir}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Train Rep Counting Model")
    parser.add_argument(
        "--data_dir", type=str, default="ml_model/data", help="Path to data directory"
    )
    parser.add_argument(
        "--epochs", type=int, default=50, help="Number of training epochs"
    )
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument(
        "--learning_rate", type=float, default=0.001, help="Learning rate"
    )
    parser.add_argument(
        "--seq_length", type=int, default=30, help="Sequence length (frames)"
    )
    parser.add_argument(
        "--checkpoint_dir",
        type=str,
        default="ml_model/checkpoints",
        help="Checkpoint directory",
    )
    parser.add_argument("--device", type=str, default=None, help="Device (cuda or cpu)")

    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        seq_length=args.seq_length,
        checkpoint_dir=args.checkpoint_dir,
        device=args.device,
    )


if __name__ == "__main__":
    main()
