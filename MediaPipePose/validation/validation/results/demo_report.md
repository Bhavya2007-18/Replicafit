# Replicafit Validation Report
Generated: 2026-03-20 18:16:52

## Summary

| Exercise | Videos | Success | Failed | MAE (std) | Accuracy % | OBO % |
|----------|--------|---------|--------|-----------|------------|-------|
| bicep_curl | 1 | 1 | 0 | 0.00 (±0.00) | 100.0% | 100.0% |
| jumping_jack | 1 | 1 | 0 | 1.00 (±0.00) | 95.0% | 100.0% |
| pushup | 3 | 3 | 0 | 0.67 (±0.58) | 93.1% | 100.0% |
| squat | 1 | 1 | 0 | 1.00 (±0.00) | 91.7% | 100.0% |

## Overall

- **Total Videos:** 6
- **Success Rate:** 100.0%
- **Overall MAE:** 0.67
- **Overall Accuracy:** 99.1%

## Metrics Explained

| Metric | Description |
|--------|-------------|
| MAE | Mean Absolute Error - average difference between predicted and actual reps |
| Accuracy % | (1 - MAE/actual_reps) × 100 |
| OBO % | Off-By-One - percentage of predictions within 1 rep of actual |

## Per-Video Results

| Video | Exercise | Actual | Predicted | MAE | Accuracy | OBO |
|-------|----------|--------|-----------|-----|----------|-----|
| bicep_curl_01.mp4 | bicep_curl | 15 | 15 | 0.00 | 100.0% | ✓ |
| jumping_jack_01.mp4 | jumping_jack | 20 | 19 | 1.00 | 95.0% | ✓ |
| pushup_01.mp4 | pushup | 10 | 10 | 0.00 | 100.0% | ✓ |
| pushup_02.mp4 | pushup | 12 | 11 | 1.00 | 91.7% | ✓ |
| pushup_03.mp4 | pushup | 8 | 9 | 1.00 | 87.5% | ✓ |
| squat_01.mp4 | squat | 12 | 11 | 1.00 | 91.7% | ✓ |
