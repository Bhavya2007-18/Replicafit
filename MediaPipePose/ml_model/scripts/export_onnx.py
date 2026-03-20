#!/usr/bin/env python3
"""
ONNX Export Script
==================
Exports trained PyTorch model to ONNX format for inference.
"""

import sys
import torch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ml_model.model import RepCountingModel


def export_to_onnx(
    checkpoint_path: str,
    output_path: str = "ml_model/rep_counting_model.onnx",
    seq_length: int = 30,
    opset_version: int = 11,
):
    """
    Export PyTorch model to ONNX format.

    Args:
        checkpoint_path: Path to PyTorch checkpoint
        output_path: Output ONNX file path
        seq_length: Sequence length used during training
        opset_version: ONNX opset version
    """
    print("=" * 60)
    print("EXPORTING MODEL TO ONNX")
    print("=" * 60)

    # Load model
    model = RepCountingModel(
        input_dim=99,
        hidden_dim=128,
        num_layers=2,
        dropout=0.3,
        num_exercises=8,
        bidirectional=True,
    )

    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    print(f"Loaded checkpoint from: {checkpoint_path}")

    # Create dummy input
    dummy_input = torch.randn(1, seq_length, 99)

    # Export to ONNX
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=["landmarks"],
        output_names=["rep_count", "exercise_probs"],
        dynamic_axes={
            "landmarks": {0: "batch_size", 1: "seq_length"},
            "rep_count": {0: "batch_size"},
            "exercise_probs": {0: "batch_size"},
        },
    )

    print(f"Exported to: {output_path}")

    # Get file size
    size_mb = Path(output_path).stat().st_size / (1024 * 1024)
    print(f"Model size: {size_mb:.2f} MB")

    # Verify export
    import onnx

    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("ONNX model verified successfully!")

    print("=" * 60)
    return output_path


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Export model to ONNX")
    parser.add_argument(
        "--checkpoint",
        type=str,
        default="ml_model/checkpoints/best_model.pt",
        help="Path to PyTorch checkpoint",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="ml_model/rep_counting_model.onnx",
        help="Output ONNX file path",
    )
    parser.add_argument("--seq_length", type=int, default=30, help="Sequence length")
    parser.add_argument("--opset", type=int, default=11, help="ONNX opset version")

    args = parser.parse_args()

    export_to_onnx(args.checkpoint, args.output, args.seq_length, args.opset)
