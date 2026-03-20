# Replicafit - Technical Documentation

## 1. Tech Stack

### Core Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Language** | Python | 3.14 |
| **Computer Vision** | OpenCV | 4.8.0+ |
| **Pose Detection** | MediaPipe Tasks | 0.10.0+ |
| **ML Model** | MediaPipe PoseLandmarker | Full (~9MB) |
| **Numerics** | NumPy | 1.24.0+ |

### ML Training Stack (Optional)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Deep Learning** | PyTorch | Model training |
| **GPU Support** | CUDA | Fast training on NVIDIA GPU |
| **Model Export** | ONNX | Cross-platform inference |
| **Data Processing** | NumPy, Pandas | Dataset handling |

---

## 2. Computer Vision Pipeline

```
Camera Input (640x480 @ 30fps)
       ↓
Frame Preprocessing (BGR → RGB)
       ↓
MediaPipe PoseLandmarker (TFLite)
       ↓
33 Pose Landmarks (x, y, z, visibility)
       ↓
Angle Calculation (arctan2)
       ↓
Hysteresis + Smoothing
       ↓
Rep Counting + Feedback
```

---

## 3. Pose Landmarks (33 Points)

MediaPipe Pose provides **33 landmarks** per person:

| Body Part | Landmarks | Index Range |
|-----------|-----------|-------------|
| **Face** | Nose, Eyes (inner/outer), Ears | 0-10 |
| **Torso** | Shoulders, Hips | 11-12, 23-24 |
| **Arms** | Elbows, Wrists | 13-16 |
| **Hands** | Fingers, Thumbs | 17-22 |
| **Legs** | Knees, Ankles | 25-28 |
| **Feet** | Heels, Toes | 29-32 |

### Landmark Structure
Each landmark contains:
- `x`: Normalized (0-1) horizontal position
- `y`: Normalized (0-1) vertical position
- `z`: Depth from camera (relative to hips)
- `visibility`: Confidence score (0-1)

---

## 4. Features Used for Calculations

| Feature Type | Count | Description |
|--------------|-------|-------------|
| **Raw Landmarks** | 33 × 4 = 132 | x, y, z, visibility for each point |
| **Joint Angles** | 8 | Calculated per exercise |
| **Body Angles** | 3 | Alignment and posture metrics |
| **Derived Metrics** | 4+ | Distance ratios, spread ratios |
| **Temporal Features** | 5 | Buffer-based smoothing |
| **Visibility Check** | 6 key points | Pose detection threshold |

### Joint Angles Per Exercise

| Exercise | Primary Angle | Reference Points |
|----------|--------------|------------------|
| Bicep Curl | Elbow flexion | shoulder → elbow → wrist |
| Pushup | Elbow flexion | shoulder → elbow → wrist |
| Squat | Knee flexion | hip → knee → ankle |
| Lunge | Knee flexion | hip → knee → ankle |
| Plank | Body alignment | shoulder → hip → ankle |
| Shoulder Press | Elbow extension | shoulder → elbow → wrist |
| Row | Elbow flexion | shoulder → elbow → wrist |
| Jumping Jack | Arm extension | wrist → elbow → shoulder |

---

## 5. Algorithms

### Angle Calculation
```python
def calculate_angle(a, b, c):
    # a, b, c = [x, y] coordinates
    radians = arctan2(c.y - b.y, c.x - b.x) - arctan2(a.y - b.y, a.x - b.x)
    angle = abs(radians * 180.0 / π)
    return min(angle, 360 - angle)  # Normalize to [0, 180]
```

### Temporal Smoothing
```python
def _smooth_angle(raw_angle):
    angle_buffer.append(raw_angle)
    if len(angle_buffer) > buffer_size:
        angle_buffer.pop(0)
    return mean(angle_buffer)  # Moving average
```

**Buffer Size**: 5 frames

### Hysteresis State Machine
```
State Diagram:
    ┌──────┐
    │  UP  │
    └──┬───┘
       │ angle > upper_threshold
       ↓
    ┌────────┐
    │ MIDDLE │  (transition zone)
    └──┬─────┘
       │ angle < lower_threshold
       ↓
    ┌──────┐
    │ DOWN │
    └──────┘
```

**Purpose**: Prevents rapid stage flipping when angle hovers near boundary values.

---

## 6. Exercises Implemented

| Exercise | States | Hysteresis | Smoothing | MET* |
|----------|--------|------------|-----------|------|
| Bicep Curl | up/middle/down | ✓ | ✓ | 3.0 |
| Pushup | up/middle/down | ✓ | ✓ | 4.0 |
| Squat | up/middle/down | ✓ | ✓ | 3.5 |
| Lunge | up/middle/down | ✓ | ✓ | 4.0 |
| Plank | up/good/dropped | ✓ | ✓ | 3.0 |
| Shoulder Press | up/middle/down | ✓ | ✓ | 3.5 |
| Row | up/middle/down | ✓ | ✓ | 4.0 |
| Jumping Jack | arms_up/arms_down | ✓ | ✓ | 4.5 |

*MET = Metabolic Equivalent of Task (used for calorie calculation)

---

## 7. Model Information

| Property | Value |
|----------|-------|
| **Model File** | pose_landmarker_full.task |
| **Size** | ~9MB |
| **Format** | TensorFlow Lite (.tflite in .task container) |
| **Framework** | MediaPipe Tasks |
| **Input** | RGB image (640×480 recommended) |
| **Output** | 33 landmarks with confidence scores |
| **Latency** | ~15-30ms per frame |
| **Min Confidence** | 0.5 (configurable) |

### Model Variants

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| pose_landmarker_lite | ~2MB | Faster | Lower |
| pose_landmarker_full | ~9MB | Medium | Higher |
| pose_landmarker_heavy | ~15MB | Slower | Highest |

---

## 8. BMR Formulas (For Calorie Integration)

### Mifflin-St Jeor Equation (Recommended)

```
Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

### Calories Burned Calculation

```
Calories = MET × (BMR / 24) × duration_hours
```

### MET Values Reference

| Intensity | MET Range | Example Exercises |
|-----------|-----------|------------------|
| Light | 2.0-3.0 | Plank, Bicep Curl |
| Moderate | 3.0-4.0 | Pushup, Squat, Lunge |
| Vigorous | 4.0-5.0 | Jumping Jack, Row, Running |

---

## 9. Validation & Testing

### Validation Framework

| Method | Dataset | Metrics |
|--------|---------|---------|
| **PushUpBench** | HuggingFace (74 videos) | MAE, Accuracy %, Off-By-One |
| **Synthetic Tests** | Hysteresis validation | Stage flip prevention |
| **Live Camera** | Real-time webcam | Visual verification |

### Test Results

```
HYSTERESIS TESTS (Boundary Flipping Prevention):
  Passed: 8/8

All exercises pass boundary stability tests.
```

---

## 10. Feature Count Summary

| Category | Count | Details |
|----------|-------|---------|
| **Landmark Attributes** | 132 | 33 landmarks × 4 (x, y, z, visibility) |
| **Calculated Angles** | 8 | Per-exercise joint angles |
| **Derived Metrics** | 4 | Distances, ratios |
| **Temporal Features** | 5 | Smoothing buffer, stage history |
| **Visibility Checks** | 6 | Key body points |
| ****Total Input Features** | **155** | Raw features from single frame |

---

## 11. Dependencies

```
opencv-python>=4.8.0
mediapipe>=0.10.0
numpy>=1.24.0
```

---

## 12. Sources & References

### Libraries
- **MediaPipe**: https://google.github.io/mediapipe/
- **OpenCV**: https://opencv.org/
- **NumPy**: https://numpy.org/

### Datasets
- **PushUpBench**: https://huggingface.co/datasets/anonymousatom/pushupbench
- **MEx Dataset**: https://archive.ics.uci.edu/ml/datasets/MEx
- **UCI HAR**: https://archive.ics.uci.edu/dataset/240/human+activity+recognition+using+smartphones

### Research
- **Compendium of Physical Activities**: https://sites.google.com/site/compendiumofphysicalactivities/
- "MEx: Multi-modal Exercises Dataset" - FLAIRS 2020
- "Real-Time Fitness Exercise Classification and Counting from Video Frames" - arXiv:2411.11548

---

## 13. File Structure

```
MediaPipePose/
├── main.py                    # CLI entry point
├── recorder.py                # Exercise recorder + MediaPipe integration
├── config.py                 # Configuration constants
├── utils.py                  # Utility functions (angles, enums)
├── exercises/                # Exercise implementations
│   ├── base.py              # BaseExercise abstract class
│   ├── bicep_curl.py
│   ├── pushup.py
│   ├── squat.py
│   ├── lunge.py
│   ├── plank.py
│   ├── shoulder_press.py
│   ├── row.py
│   └── jumping_jack.py
├── validation/               # Testing and validation
│   ├── test_accuracy.py      # Full validation suite
│   ├── validate.py           # Quick validator
│   └── test_hysteresis.py   # Hysteresis tests
├── pose_landmarker_full.task # ML model (~9MB)
├── requirements.txt
└── venv/                    # Virtual environment
```

---

## 14. Accuracy Improvements (v2.0-v2.3)

| Version | Feature | Impact |
|---------|---------|--------|
| v2.0 | Temporal smoothing | Reduces angle jitter |
| v2.0 | Hysteresis (bicep curl) | Prevents stage flipping |
| v2.1 | Hysteresis (pushup, jumping jack) | Better rep counting |
| v2.2 | Validation framework | Benchmark support |
| v2.3 | Hysteresis (all 8 exercises) | Full coverage |

---

## 15. ML Rep Counting Model (v3.0+)

### Architecture

```
Input: (batch, seq_len=30, 99)    # 30 frames × 33 landmarks × 3 coords
    ↓
Input Projection (Linear: 99 → 64)
    ↓
Temporal Conv1D (64 filters, kernel=3)
    ↓
BiLSTM (128 hidden, 2 layers)
    ↓
Attention Mechanism
    ↓
├── Rep Counting Head (Dense: 256 → 1, Sigmoid × 50)
└── Exercise Classification Head (Dense: 256 → 8, Softmax)
    ↓
Output: (rep_count, exercise_probs)
```

### Model Specifications

| Property | Value |
|----------|-------|
| **Parameters** | ~520,000 |
| **Model Size** | ~2 MB (PyTorch), ~1 MB (ONNX) |
| **Input Shape** | (30, 99) - 30 frames × 99 features |
| **Output** | Rep count (0-50), Exercise probabilities (8 classes) |
| **Latency** | ~10ms on GPU, ~50ms on CPU |

### Training Configuration

| Parameter | Value |
|-----------|-------|
| **Batch Size** | 32 |
| **Sequence Length** | 30 frames (~1 second) |
| **Learning Rate** | 0.001 |
| **Epochs** | 50-100 (early stopping) |
| **Optimizer** | AdamW |
| **Loss** | MSE (reps) + CrossEntropy (exercise) |
| **GPU** | CUDA (NVIDIA) |

### ML Pipeline Files

| File | Purpose |
|------|---------|
| `ml_model/model.py` | BiLSTM model architecture |
| `ml_model/data_processing.py` | Dataset loading, normalization |
| `ml_model/data_extractor.py` | Extract landmarks from videos |
| `ml_model/generate_synthetic.py` | Synthetic data (DEMO ONLY) |
| `ml_model/inference.py` | Inference wrapper for Replicafit |
| `ml_model/scripts/train.py` | Training script |
| `ml_model/scripts/evaluate.py` | Evaluation script |
| `ml_model/scripts/export_onnx.py` | ONNX export |

### Data Requirements

**REAL DATA (Required for production):**

| Dataset | Source | Rep Counts | Format |
|---------|--------|------------|--------|
| **PushUpBench** | HuggingFace | ✅ Yes | Video + JSON |
| **MEx Dataset** | UCI | ⚠️ Extract | Sensor + Video |
| **Recorded Videos** | Your own | ✅ Label | Video |

**Data Format:**
```
data/
├── train/
│   ├── pushup/
│   │   ├── video_001.npy      # (N, 33, 3) landmarks
│   │   └── video_001_meta.json # {"rep_count": 15}
│   └── squat/
├── val/
└── test/
```

### Training Commands

```bash
# Install ML dependencies
pip install -r ml_model/requirements.txt

# Generate demo data (DO NOT USE FOR REAL TRAINING)
python ml_model/generate_synthetic.py --samples 50

# Extract real data from videos
python ml_model/data_extractor.py --mode pushupbench \
  --videos_dir ./pushupbench_videos \
  --output ml_model/data/train

# Train model
python ml_model/scripts/train.py \
  --data_dir ml_model/data \
  --epochs 100 \
  --batch_size 32 \
  --gpus 1

# Evaluate
python ml_model/scripts/evaluate.py \
  --checkpoint ml_model/checkpoints/best_model.pt

# Export to ONNX
python ml_model/scripts/export_onnx.py \
  --checkpoint ml_model/checkpoints/best_model.pt
```

### Expected Metrics

| Metric | Rule-Based | ML Model | Target |
|--------|-----------|----------|--------|
| **MAE** | ~1.5 reps | < 1.0 reps | < 1.0 |
| **OBO %** | ~85% | > 95% | > 95% |
| **Accuracy** | ~80% | > 85% | > 90% |

---

## 16. File Structure

```
MediaPipePose/
├── main.py                    # CLI entry point
├── recorder.py                # Exercise recorder + MediaPipe integration
├── config.py                 # Configuration constants
├── utils.py                  # Utility functions (angles, enums)
├── exercises/                 # Exercise implementations
│   ├── base.py              # BaseExercise abstract class
│   ├── bicep_curl.py
│   ├── pushup.py
│   ├── squat.py
│   ├── lunge.py
│   ├── plank.py
│   ├── shoulder_press.py
│   ├── row.py
│   └── jumping_jack.py
├── ml_model/                 # ML Rep Counting Model (v3.0)
│   ├── model.py             # BiLSTM architecture
│   ├── data_processing.py   # Dataset utilities
│   ├── data_extractor.py    # Video → landmarks
│   ├── generate_synthetic.py # DEMO ONLY
│   ├── inference.py         # Inference wrapper
│   ├── requirements.txt     # ML dependencies
│   ├── checkpoints/         # Trained models
│   ├── data/               # Training data
│   └── scripts/
│       ├── train.py        # Training script
│       ├── evaluate.py      # Evaluation script
│       └── export_onnx.py  # ONNX export
├── validation/               # Testing and validation
│   ├── test_accuracy.py    # Full validation suite
│   ├── validate.py         # Quick validator
│   └── test_hysteresis.py # Hysteresis tests
├── pose_landmarker_full.task # ML model (~9MB)
├── TECHNICAL_DOCUMENTATION.md
├── requirements.txt
└── venv/                   # Virtual environment
```

---

## 17. Quick Start

### Rule-Based System (Current)
```bash
# Record exercise
python main.py record --exercise pushup --duration 30

# Validate
python validation/validate.py --live pushup
```

### ML System (With Training)
```bash
# 1. Install dependencies
pip install -r ml_model/requirements.txt

# 2. Extract data from videos
python ml_model/data_extractor.py --mode pushupbench \
  --videos_dir ./videos --output ml_model/data/train

# 3. Train model (requires GPU)
python ml_model/scripts/train.py --data_dir ml_model/data \
  --epochs 100 --gpus 1

# 4. Evaluate
python ml_model/scripts/evaluate.py

# 5. Export to ONNX
python ml_model/scripts/export_onnx.py
```

---

*Document Version: 3.0*  
*Last Updated: 2026-03-20*
