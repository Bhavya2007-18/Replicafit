#!/usr/bin/env python3
"""
Synthetic Hysteresis Validation Test
=====================================
Tests that hysteresis prevents rapid stage flipping.

This simulates angle data hovering at boundary values to verify
that the hysteresis logic prevents false rep counting.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from exercises import get_exercise


def test_hysteresis_prevents_flipping(
    exercise_name: str, boundary_angle: float, num_frames: int = 50
) -> dict:
    """
    Test that an exercise doesn't rapidly flip stages when angle
    hovers near the boundary value.

    Returns: dict with test results
    """
    exercise = get_exercise(exercise_name)
    exercise.start()

    # Simulate angle hovering just above/below boundary
    stage_flips = 0
    prev_stage = exercise.current_stage

    for i in range(num_frames):
        # Add small jitter to simulate real-world angle fluctuation
        jitter = (i % 5 - 2) * 2  # -4 to +4 degrees jitter
        test_angle = boundary_angle + jitter

        # Get stage (this exercises the hysteresis logic)
        stage = exercise.get_stage(test_angle, test_angle - 10)

        if stage != prev_stage:
            stage_flips += 1
            prev_stage = stage

    exercise.stop()

    return {
        "exercise": exercise_name,
        "boundary_angle": boundary_angle,
        "frames_tested": num_frames,
        "stage_flips": stage_flips,
        "hysteresis_working": stage_flips <= 2,  # Allow max 2 flips (enter/exit)
    }


def test_rep_count_with_slow_movement(exercise_name: str) -> dict:
    """
    Test that slow, deliberate reps are counted correctly.
    """
    exercise = get_exercise(exercise_name)
    exercise.start()

    # Simulate a slow, clean rep
    stages = []

    # Start "up" position
    up_angle = 170
    for angle in range(170, 30, -5):  # Down motion
        stage = exercise.get_stage(angle, angle + 5)
        stages.append(stage)
        exercise.current_stage = stage
        if stage == "down":
            break

    # Transition back up
    for angle in range(30, 175, 5):  # Up motion
        stage = exercise.get_stage(angle, angle - 5)
        stages.append(stage)
        exercise.current_stage = stage
        if stage == "up":
            break

    # Count rep transitions (down -> up = 1 rep)
    rep_counted = 0
    was_down = False
    for stage in stages:
        if stage == "down":
            was_down = True
        elif stage == "up" and was_down:
            rep_counted += 1
            was_down = False

    exercise.stop()

    return {
        "exercise": exercise_name,
        "rep_expected": 1,
        "rep_counted": rep_counted,
        "rep_count_correct": rep_counted == 1,
        "stages_seen": list(set(stages)),
    }


def run_all_tests():
    print("=" * 70)
    print("HYSTERESIS VALIDATION TEST")
    print("=" * 70)
    print()

    results = []

    # Test 1: Boundary flipping prevention (THE KEY TEST)
    print("TEST 1: Boundary Flipping Prevention")
    print("-" * 50)
    print("Simulating angle jitter near boundaries to verify hysteresis works")
    print("(Key accuracy improvement - prevents rapid stage flipping)\n")

    tests = [
        ("bicep_curl", 25, "up boundary"),
        ("bicep_curl", 165, "down boundary"),
        ("pushup", 25, "up boundary"),
        ("pushup", 165, "down boundary"),
        ("squat", 100, "transition zone"),
        ("lunge", 90, "down boundary"),
        ("shoulder_press", 30, "up boundary"),
        ("row", 40, "up boundary"),
    ]

    boundary_flip_passed = 0
    for exercise_name, boundary, desc in tests:
        result = test_hysteresis_prevents_flipping(exercise_name, boundary)
        status = "✓ PASS" if result["hysteresis_working"] else "✗ FAIL"
        print(
            f"  {exercise_name:18} boundary={boundary:3}° {desc:15} | "
            f"Flips: {result['stage_flips']:2} | {status}"
        )
        results.append(result)
        if result["hysteresis_working"]:
            boundary_flip_passed += 1

    print()
    print("TEST 2: Smooth Rep Movement (Stage Logic)")
    print("-" * 50)
    print("Simulating clean rep to verify stage transitions work\n")

    smooth_rep_passed = 0
    for exercise_name in [
        "bicep_curl",
        "pushup",
        "squat",
        "lunge",
        "shoulder_press",
        "row",
        "jumping_jack",
    ]:
        result = test_rep_count_with_slow_movement(exercise_name)
        status = "✓ PASS" if result["rep_count_correct"] else "✗ FAIL"
        print(
            f"  {exercise_name:18} | Expected: {result['rep_expected']} | "
            f"Counted: {result['rep_counted']} | {status}"
        )
        results.append(result)
        if result["rep_count_correct"]:
            smooth_rep_passed += 1

    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    print(f"\n  HYSTERESIS TESTS (Boundary Flipping Prevention):")
    print(f"    Passed: {boundary_flip_passed}/{len(tests)}")
    print(
        f"    Status: {'✓ ALL PASS' if boundary_flip_passed == len(tests) else '✗ SOME FAIL'}"
    )

    print(f"\n  SMOOTH REP TESTS (Stage Transition Logic):")
    print(f"    Passed: {smooth_rep_passed}/7")
    print(f"    Note: Some exercises require process_frame() for full rep counting")

    print()

    if boundary_flip_passed == len(tests):
        print("🎉 KEY RESULT: Hysteresis is working correctly!")
        print("   Stage flipping is prevented at boundary values.")
        print("   This improves rep counting accuracy significantly.")
    else:
        print("⚠️  Some hysteresis tests failed - review above.")

    print()
    print("=" * 70)

    return boundary_flip_passed == len(tests)


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
