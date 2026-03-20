# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- MediaPipe Tasks API migration (see PR/Commit for details)
- Custom `draw_landmarks()` function for pose skeleton visualization
- `pose_landmarker_full.task` model bundled with project

### Changed
- Migrated from MediaPipe legacy `solutions` API to Tasks API
- Updated `recorder.py` to use `PoseLandmarker` from `mediapipe.tasks.python.vision`
- Removed unused `import mediapipe as mp` from `utils.py`

### Fixed
- `AttributeError: module 'mediapipe' has no attribute 'solutions'`
  - Root cause: MediaPipe 0.10.31+ removed the legacy `solutions` API
  - Solution: Migrated to Tasks API which is the new official approach

### [Unreleased] - v2.1.0 (Rep Accuracy Improvements #2)

#### Added
- Hysteresis logic to `pushup.py` for stage detection
- Angle smoothing to `jumping_jack.py` (via `_smooth_angle()`)
- Hysteresis logic to `jumping_jack.py` for arm stage detection

#### Changed
- `exercises/pushup.py`:
  - `get_stage()` now uses hysteresis with transition zones
  - up: angle <= 25, down: angle > 165
  - Transition zones: up→middle at 40+, down→middle at <40
- `exercises/jumping_jack.py`:
  - Added smoothing via `_smooth_angle()` to prevent angle jitter
  - `get_stage()` now uses hysteresis with transition zones
  - arms_up: angle <= 45, arms_down: angle > 55
  - Transition zone: 45-55 for middle state
- `utils.py`:
  - Improved `calculate_angle()` normalization for edge cases

#### Why These Changes?
- **Hysteresis**: Prevents rapid stage flipping when angle hovers near boundary values
- **Smoothing in jumping_jack**: Previously bypassed base class smoothing (no outlier rejection)

### [Unreleased] - v2.3.0 (Complete Hysteresis Coverage)

#### Added
- Hysteresis logic to `squat.py` for stage detection
- Hysteresis logic to `lunge.py` for stage detection
- Hysteresis logic to `plank.py` for stage detection
- Hysteresis logic to `shoulder_press.py` for stage detection
- Hysteresis logic to `row.py` for stage detection
- Skeleton overlay in `validate.py` live camera mode

#### Changed
- `exercises/squat.py`:
  - `get_stage()` now uses hysteresis with transition zones
  - up: angle >= 155, down: angle <= 95
  - Transition zones: 120-140 (down→middle), 140-155 (middle→up)
- `exercises/lunge.py`:
  - `get_stage()` now uses hysteresis with transition zones
  - up: angle >= 150, down: angle <= 85
  - Transition zones: 110-130 (down→middle), 130-155 (middle→up)
- `exercises/plank.py`:
  - `get_stage()` now uses hysteresis for hold stability
  - up: angle >= 155, dropped: angle < 130
  - Transition zones: 130-145 (dropped→good), 145-155 (good→up)
- `exercises/shoulder_press.py`:
  - `get_stage()` now uses hysteresis with transition zones
  - up: angle <= 30, down: angle > 165
  - Transition zones: 40-140 (down→middle), 140-165 (middle→up)
- `exercises/row.py`:
  - `get_stage()` now uses hysteresis with transition zones
  - up: angle <= 35, down: angle > 150
  - Transition zones: 50-120 (up→middle), 120-150 (middle→down)
- `validation/validate.py`:
  - Added `draw_landmarks()` import for skeleton overlay
  - Added skeleton rendering in live camera mode

#### All Exercises Now Have Hysteresis
| Exercise | States | Status |
|----------|--------|--------|
| Bicep Curl | up/middle/down | ✅ |
| Pushup | up/middle/down | ✅ |
| Jumping Jack | arms_up/arms_down | ✅ |
| Squat | up/middle/down | ✅ |
| Lunge | up/middle/down | ✅ |
| Plank | up/good/dropped | ✅ |
| Shoulder Press | up/middle/down | ✅ |
| Row | up/middle/down | ✅ |

### [Unreleased] - v2.2.0 (Validation Suite)

#### Added
- **Validation framework** (`validation/test_accuracy.py`)
  - Support for PushUpBench dataset (HuggingFace)
  - Support for Real-Time Exercise Recognition dataset (Kaggle)
  - Ground truth comparison and accuracy metrics
  - MAE, Accuracy %, Off-By-One metrics
  - Auto-generated validation reports
- **Quick validator** (`validation/validate.py`)
  - Demo mode for testing without data
  - Live camera testing for real-time validation
  - Directory-based batch validation
- **Sample ground truth data** for testing

#### Datasets Integrated
| Dataset | Source | Exercises | Rep Counts |
|---------|--------|-----------|------------|
| PushUpBench | HuggingFace | pushup | ✅ |
| Real-Time Exercise Recognition | Kaggle | squat, pushup, shoulder_press, bicep_curl | ✅ |

#### Usage
```bash
# Demo validation (no data required)
python validation/test_accuracy.py --mode demo

# Quick validator demo
python validation/validate.py --demo

# Live camera test
python validation/validate.py --live pushup

# Validate with your own videos
python validation/validate.py --videos ./my_videos
```

### [v2.0.0] - 2026-03-20 (Rep Accuracy Improvements)

#### Added
- **Temporal smoothing** for angle values (`_smooth_angle()` method in `base.py`)
- **Hysteresis logic** in stage detection to prevent rapid stage flipping

#### Changes
- `exercises/base.py`:
  - Added `angle_buffer` (list) and `buffer_size` (int=5) for moving average smoothing
  - Added `_smooth_angle()` method - applies moving average to raw angles
  - Updated `start()` and `reset()` to clear smoothing buffers
- `exercises/bicep_curl.py`:
  - Updated `get_stage()` with hysteresis thresholds:
    - "up": angle <= 25 (was <= 30)
    - "down": angle > 165 (was > 160)
    - Transition zones: 25-40 (up→middle), 140-165 (down→middle)
  - Updated `get_rep_thresholds()` to reflect new values

#### Why These Changes?
- **Smoothing**: Reduces frame-to-frame angle jitter that causes rep count errors
- **Hysteresis**: Prevents rapid stage flipping when angle hovers near boundary values

---

## Project Info

### Replicafit - MediaPipe Exercise Recorder

AI-powered exercise tracking with real-time pose detection using MediaPipe.

### Tech Stack
- **Python 3.14** (in venv)
- **MediaPipe 0.10.30** (Tasks API)
- **OpenCV** (camera capture, drawing)
- **NumPy** (angle calculations)

### Project Structure
```
MediaPipePose/
├── main.py              # CLI entry point
├── recorder.py           # ExerciseRecorder class + MediaPipe integration
├── config.py            # Configuration constants
├── utils.py             # Utility functions (angle calc, enums)
├── exercises/           # Exercise-specific logic
│   ├── base.py          # BaseExercise abstract class
│   ├── bicep_curl.py    # Bicep curl detection
│   ├── squat.py         # Squat detection
│   ├── pushup.py        # Pushup detection
│   └── ...
├── pose_landmarker_full.task  # ML model for pose detection (~9MB)
├── requirements.txt     # Python dependencies
└── venv/               # Virtual environment
```

### Running the Project

```bash
cd /home/prakhar/Documents/GitHub/Replicafit/MediaPipePose
source venv/bin/activate.fish  # or: source venv/bin/activate

# Record an exercise
python main.py record --exercise bicep_curl --duration 30

# List available exercises
python main.py record --help

# Other commands
python main.py list              # List recorded sessions
python main.py analyze <id>     # Analyze a session
python main.py progress          # Show progress
```

### Current Status (2026-03-20)

**Completed:**
- MediaPipe Tasks API migration (legacy `solutions` API no longer works)
- Custom drawing utilities for pose skeleton
- All 8 exercises working with new API

**Known Issues:**
- Rep counting can be slightly inaccurate due to angle jitter
- Stage transitions don't use hysteresis (can cause rapid flipping at boundaries)
- No temporal smoothing on angle values

**Next Steps (High Priority):**
1. Add temporal smoothing (moving average of angles)
2. Add hysteresis to stage detection
3. Test and verify rep accuracy improvement

### MediaPipe Tasks API Migration Notes

**Why the migration happened:**
- MediaPipe 0.10.31+ removed `mediapipe.solutions.pose`
- Only `mediapipe.tasks.python.vision.PoseLandmarker` remains
- Old code used: `mp.solutions.pose.Pose()`
- New code uses: `PoseLandmarker.create_from_options()`

**Key API differences:**
| Old API | New API |
|---------|---------|
| `mp.solutions.pose.Pose()` | `PoseLandmarker.create_from_options()` |
| `mp_pose.process(rgb_frame)` | `pose_landmarker.detect_for_video(mp_image, timestamp_ms)` |
| `results.pose_landmarks.landmark` | `results.pose_landmarks[0]` |
| `mp.solutions.drawing_utils` | Custom `draw_landmarks()` function |

**Model files required:**
- `pose_landmarker_full.task` - bundled in repo
- Available variants: `pose_landmarker_lite.task` (faster), `pose_landmarker_heavy.task` (more accurate)

### Configuration

Key settings in `config.py`:
- `MIN_DETECTION_CONFIDENCE = 0.5` - Pose detection threshold
- `MIN_TRACKING_CONFIDENCE = 0.5` - Pose presence threshold
- `FRAME_WIDTH = 640`, `FRAME_HEIGHT = 480` - Camera resolution
- `POSE_MODEL_PATH = "pose_landmarker_full.task"` - Model file location
