import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from collections import defaultdict

from exercises import EXERCISE_INFO
from config import RECORDINGS_DIR


class SessionAnalytics:
    def __init__(self, session_path: str):
        with open(session_path, "r") as f:
            self.data = json.load(f)

        self.session_id = self.data.get("session_id")
        self.timestamp = self.data.get("timestamp")
        self.exercise = self.data.get("exercise")
        self.summary = self.data.get("summary", {})
        self.frame_data = self.data.get("frame_data", [])

    def get_summary_stats(self) -> Dict:
        return {
            "session_id": self.session_id,
            "timestamp": self.timestamp,
            "exercise": self.summary.get("display_name", self.exercise),
            "total_reps": self.summary.get("total_reps", 0),
            "average_accuracy": self.summary.get("average_accuracy", 0),
            "duration_seconds": self.summary.get("duration_seconds", 0),
            "reps_per_minute": self.summary.get("reps_per_minute", 0),
            "best_rep": self._get_best_rep(),
            "worst_rep": self._get_worst_rep(),
        }

    def _get_best_rep(self) -> Optional[Dict]:
        rep_data = self.summary.get("rep_data", [])
        if not rep_data:
            return None
        best = max(rep_data, key=lambda x: x["accuracy"])
        return best

    def _get_worst_rep(self) -> Optional[Dict]:
        rep_data = self.summary.get("rep_data", [])
        if not rep_data:
            return None
        worst = min(rep_data, key=lambda x: x["accuracy"])
        return worst

    def get_accuracy_trend(self) -> List[float]:
        rep_data = self.summary.get("rep_data", [])
        return [r["accuracy"] for r in rep_data]

    def get_form_issues(self) -> List[Dict]:
        rep_data = self.summary.get("rep_data", [])
        issues = []

        for rep in rep_data:
            if rep["accuracy"] < 70:
                issues.append(
                    {
                        "rep_number": rep["rep_number"],
                        "accuracy": rep["accuracy"],
                        "issue": rep.get("feedback", "Form could be improved"),
                    }
                )

        return issues

    def get_timing_analysis(self) -> Dict:
        rep_data = self.summary.get("rep_data", [])
        if len(rep_data) < 2:
            return {"avg_rep_time": 0, "fastest_rep": 0, "slowest_rep": 0}

        times = [r.get("duration_ms", 0) for r in rep_data]

        return {
            "avg_rep_time_ms": sum(times) / len(times),
            "fastest_rep_ms": min(times),
            "slowest_rep_ms": max(times),
            "consistency_score": self._calculate_consistency(times),
        }

    def _calculate_consistency(self, times: List[float]) -> float:
        if len(times) < 2:
            return 100.0

        mean = sum(times) / len(times)
        variance = sum((t - mean) ** 2 for t in times) / len(times)
        std_dev = variance**0.5

        cv = (std_dev / mean) * 100 if mean > 0 else 0
        consistency = max(0, 100 - cv)

        return consistency

    def print_full_report(self):
        stats = self.get_summary_stats()
        timing = self.get_timing_analysis()
        issues = self.get_form_issues()

        print(f"\n{'=' * 60}")
        print(f"SESSION ANALYTICS REPORT")
        print(f"{'=' * 60}")
        print(f"Session ID: {stats['session_id']}")
        print(f"Date: {stats['timestamp']}")
        print(f"Exercise: {stats['exercise']}")
        print()

        print(f"{'OVERALL PERFORMANCE':^60}")
        print("-" * 60)
        print(f"  Total Reps:     {stats['total_reps']}")
        print(f"  Avg Accuracy:   {stats['average_accuracy']:.1f}%")
        print(f"  Duration:      {stats['duration_seconds']:.1f}s")
        print(f"  Reps/Min:      {stats['reps_per_minute']:.1f}")
        print()

        print(f"{'TIMING ANALYSIS':^60}")
        print("-" * 60)
        print(f"  Avg Rep Time:     {timing['avg_rep_time_ms']:.0f}ms")
        print(f"  Fastest Rep:      {timing['fastest_rep_ms']:.0f}ms")
        print(f"  Slowest Rep:      {timing['slowest_rep_ms']:.0f}ms")
        print(f"  Consistency:      {timing['consistency_score']:.1f}%")
        print()

        if stats["best_rep"]:
            print(f"{'BEST REP':^60}")
            print("-" * 60)
            print(
                f"  Rep #{stats['best_rep']['rep_number']}: {stats['best_rep']['accuracy']:.1f}%"
            )
            print(f"  Feedback: {stats['best_rep']['feedback']}")
            print()

        if issues:
            print(f"{'FORM ISSUES TO ADDRESS':^60}")
            print("-" * 60)
            for issue in issues:
                print(
                    f"  Rep #{issue['rep_number']}: {issue['accuracy']:.1f}% - {issue['issue']}"
                )
            print()

        print(f"{'=' * 60}\n")

        print("Per-Rep Breakdown:")
        print("-" * 60)
        for rep in self.summary.get("rep_data", []):
            bar_len = int(rep["accuracy"] / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            status = (
                "✓" if rep["accuracy"] >= 80 else "●" if rep["accuracy"] >= 60 else "✗"
            )
            print(
                f"  {rep['rep_number']:2d} [{bar}] {rep['accuracy']:5.1f}% {status} {rep.get('feedback', '')}"
            )
        print()


class ProgressTracker:
    def __init__(self, recordings_dir: str = RECORDINGS_DIR):
        self.recordings_dir = Path(recordings_dir)
        self.sessions: List[SessionAnalytics] = []
        self._load_sessions()

    def _load_sessions(self):
        if not self.recordings_dir.exists():
            return

        for filepath in self.recordings_dir.glob("*.json"):
            try:
                session = SessionAnalytics(str(filepath))
                self.sessions.append(session)
            except Exception as e:
                print(f"Failed to load {filepath}: {e}")

        self.sessions.sort(key=lambda x: x.timestamp or "")

    def get_exercise_progress(self, exercise: str) -> Dict:
        exercise_sessions = [s for s in self.sessions if s.exercise == exercise]

        if not exercise_sessions:
            return {"error": "No sessions found for this exercise"}

        reps = [s.summary.get("total_reps", 0) for s in exercise_sessions]
        accuracies = [s.summary.get("average_accuracy", 0) for s in exercise_sessions]

        return {
            "exercise": EXERCISE_INFO.get(exercise, {}).get("name", exercise),
            "total_sessions": len(exercise_sessions),
            "total_reps": sum(reps),
            "avg_accuracy": sum(accuracies) / len(accuracies),
            "best_accuracy": max(accuracies) if accuracies else 0,
            "improvement": accuracies[-1] - accuracies[0] if len(accuracies) > 1 else 0,
            "sessions_timestamps": [s.timestamp for s in exercise_sessions],
        }

    def get_all_exercises_summary(self) -> Dict:
        by_exercise = defaultdict(list)

        for session in self.sessions:
            by_exercise[session.exercise].append(session)

        summary = {}
        for exercise, sessions in by_exercise.items():
            reps = [s.summary.get("total_reps", 0) for s in sessions]
            accuracies = [s.summary.get("average_accuracy", 0) for s in sessions]

            summary[exercise] = {
                "display_name": EXERCISE_INFO.get(exercise, {}).get("name", exercise),
                "total_sessions": len(sessions),
                "total_reps": sum(reps),
                "avg_accuracy": sum(accuracies) / len(accuracies) if accuracies else 0,
                "best_accuracy": max(accuracies) if accuracies else 0,
            }

        return summary

    def print_progress_report(self):
        summary = self.get_all_exercises_summary()

        print(f"\n{'=' * 60}")
        print(f"PROGRESS REPORT")
        print(f"{'=' * 60}")
        print(f"Total Sessions: {len(self.sessions)}")
        print()

        if not summary:
            print("No sessions recorded yet.")
            print()
            return

        for exercise, data in summary.items():
            print(f"{data['display_name'].upper():^60}")
            print("-" * 60)
            print(f"  Sessions:     {data['total_sessions']}")
            print(f"  Total Reps:   {data['total_reps']}")
            print(f"  Avg Accuracy: {data['avg_accuracy']:.1f}%")
            print(f"  Best Accuracy: {data['best_accuracy']:.1f}%")

            progress = self.get_exercise_progress(exercise)
            if "improvement" in progress:
                imp = progress["improvement"]
                arrow = "↑" if imp > 0 else "↓" if imp < 0 else "→"
                print(f"  Improvement:  {imp:+.1f}% {arrow}")
            print()

        print(f"{'=' * 60}\n")

    def compare_sessions(self, session1_id: str, session2_id: str):
        s1 = next((s for s in self.sessions if s.session_id == session1_id), None)
        s2 = next((s for s in self.sessions if s.session_id == session2_id), None)

        if not s1 or not s2:
            print("One or both sessions not found.")
            return

        print(f"\n{'=' * 60}")
        print(f"SESSION COMPARISON")
        print(f"{'=' * 60}")
        print(f"{'Metric':<20} {'Session 1':>15} {'Session 2':>15} {'Change':>10}")
        print("-" * 60)

        r1, r2 = s1.summary, s2.summary
        reps_diff = r2.get("total_reps", 0) - r1.get("total_reps", 0)
        acc_diff = r2.get("average_accuracy", 0) - r1.get("average_accuracy", 0)

        print(
            f"{'Total Reps':<20} {r1.get('total_reps', 0):>15} {r2.get('total_reps', 0):>15} {reps_diff:>+10}"
        )
        print(
            f"{'Avg Accuracy':<20} {r1.get('average_accuracy', 0):>14.1f}% {r2.get('average_accuracy', 0):>14.1f}% {acc_diff:>+9.1f}%"
        )
        print(
            f"{'Duration':<20} {r1.get('duration_seconds', 0):>14.1f}s {r2.get('duration_seconds', 0):>14.1f}s"
        )
        print(f"{'=' * 60}\n")


def list_sessions(recordings_dir: str = RECORDINGS_DIR):
    dir_path = Path(recordings_dir)

    if not dir_path.exists():
        print(f"\nNo recordings directory found at: {recordings_dir}")
        print("Record a session first!")
        return

    sessions = list(dir_path.glob("*.json"))

    if not sessions:
        print("\nNo sessions recorded yet.")
        print()
        return

    print(f"\n{'=' * 70}")
    print(f"RECORDED SESSIONS")
    print(f"{'=' * 70}")
    print(f"{'Session ID':<12} {'Exercise':<20} {'Date':<20} {'Reps':>6} {'Acc':>8}")
    print("-" * 70)

    for filepath in sorted(sessions, key=lambda x: x.stat().st_mtime, reverse=True):
        try:
            with open(filepath, "r") as f:
                data = json.load(f)

            timestamp = data.get("timestamp", "Unknown")
            if timestamp != "Unknown":
                dt = datetime.fromisoformat(timestamp)
                timestamp = dt.strftime("%Y-%m-%d %H:%M")

            exercise = EXERCISE_INFO.get(data.get("exercise", ""), {}).get(
                "name", data.get("exercise", "")
            )
            summary = data.get("summary", {})

            print(
                f"{data.get('session_id', 'N/A'):<12} {exercise:<20} {timestamp:<20} {summary.get('total_reps', 0):>6} {summary.get('average_accuracy', 0):>7.1f}%"
            )
        except Exception as e:
            print(f"Error reading {filepath}: {e}")

    print(f"{'=' * 70}\n")
