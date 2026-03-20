# ML Rep Counting Model

## Overview

This module contains the BiLSTM model for improved exercise rep counting.

## Quick Start

```bash
# Install ML dependencies
pip install -r ml_model/requirements.txt

# Generate synthetic demo data (NOT FOR REAL TRAINING)
python ml_model/generate_synthetic.py --samples 50

# Train model
python ml_model/scripts/train.py --data_dir ml_model/data --epochs 100

# Evaluate
python ml_model/scripts/evaluate.py
```

## IMPORTANT: Data Requirements

**DO NOT use synthetic data for production training!**

For real model training, use:
- **PushUpBench**: https://huggingface.co/datasets/anonymousatom/pushupbench
- **Record your own videos** and label rep counts
- **MEx Dataset**: https://archive.ics.uci.edu/ml/datasets/MEx

## Files

| File | Description |
|------|-------------|
| `model.py` | BiLSTM model architecture |
| `data_processing.py` | Dataset loading and normalization |
| `data_extractor.py` | Extract landmarks from videos |
| `generate_synthetic.py` | Synthetic data (DEMO ONLY) |
| `inference.py` | Inference wrapper for Replicafit |
| `requirements.txt` | ML dependencies |

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/train.py` | Training pipeline |
| `scripts/evaluate.py` | Model evaluation |
| `scripts/export_onnx.py` | Export to ONNX format |

## Architecture

- **Input**: 30 frames × 33 landmarks × 3 coordinates = 2,970 features
- **Model**: BiLSTM with attention
- **Output**: Rep count + Exercise type
- **Parameters**: ~520,000

## Hardware Requirements

- **GPU**: NVIDIA with CUDA (recommended)
- **RAM**: 8GB+ for training
- **Disk**: 10GB+ for datasets
