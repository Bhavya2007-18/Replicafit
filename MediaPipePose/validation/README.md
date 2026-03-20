# Replicafit Validation Suite

Validation framework for testing rep counting accuracy using benchmark datasets.

## Quick Start

```bash
# Demo validation (no data required)
python validation/test_accuracy.py --mode demo

# Quick demo
python validation/validate.py --demo

# Live camera test (use your webcam)
python validation/validate.py --live pushup
```

## Validation Scripts

### test_accuracy.py - Full Validation Suite

Comprehensive validation with dataset downloads and metrics.

```bash
# Download datasets and run validation
python validation/test_accuracy.py --mode all

# Download only
python validation/test_accuracy.py --mode download

# Validate with downloaded data
python validation/test_accuracy.py --mode validate

# Demo with simulated data
python validation/test_accuracy.py --mode demo
```

### validate.py - Quick Validator

Lightweight validator for testing with your own data.

```bash
# Demo mode (simulated data)
python validation/validate.py --demo

# Live camera test
python validation/validate.py --live bicep_curl
python validation/validate.py --live pushup
python validation/validate.py --live jumping_jack

# Validate videos in directory
python validation/validate.py --videos ./my_videos
```

## Ground Truth Format

Create ground_truth.json for your videos:

```json
{
  "video_001": {
    "exercise": "pushup",
    "rep_count": 12
  },
  "video_002": {
    "exercise": "squat",
    "rep_count": 15
  }
}
```

## Metrics Explained

| Metric | Description | Good Score |
|--------|-------------|------------|
| MAE | Mean Absolute Error | < 2 reps |
| Accuracy % | (1 - MAE/actual) x 100 | > 90% |
| OBO % | Off-By-One rate | > 95% |

## Datasets

### PushUpBench
- Source: https://huggingface.co/datasets/anonymousatom/pushupbench
- Exercises: pushup
- Ground truth: rep counts included

### Real-Time Exercise Recognition
- Source: https://www.kaggle.com/datasets/riccardoriccio/real-time-exercise-recognition-dataset
- Exercises: squat, pushup, shoulder_press, bicep_curl
- Ground truth: rep counts included

## Directory Structure

```
validation/
├── test_accuracy.py      # Full validation suite
├── validate.py           # Quick validator
├── datasets/             # Downloaded datasets
│   ├── pushupbench/
│   └── exercise_recognition/
├── ground_truth.json     # Your ground truth
└── results/              # Test outputs
    └── *.md              # Reports
```

## Example Output

```
============================================================
REPLICAFIT VALIDATION - DEMO MODE
============================================================

Simulated Validation Results:
------------------------------------------------------------
  pushup          | Expected: 10 | Predicted: 10 | MAE: 0.0 | Accuracy: 100.0% OK
  pushup          | Expected: 12 | Predicted: 11 | MAE: 1.0 | Accuracy: 91.7% OK
  bicep_curl      | Expected: 15 | Predicted: 15 | MAE: 0.0 | Accuracy: 100.0% OK
------------------------------------------------------------

Summary:
  Total Videos: 7
  Overall MAE: 0.71
  Overall Accuracy: 94.3%
  Off-By-One Rate: 100.0%
```
