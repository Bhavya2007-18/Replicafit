#!/usr/bin/env python3
"""
Replicafit MediaPipe Exercise Recorder
AI-powered exercise tracking with real-time pose detection
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from recorder import ExerciseRecorder, select_exercise
from analytics import SessionAnalytics, ProgressTracker, list_sessions
from exercises import EXERCISE_INFO


def main():
    parser = argparse.ArgumentParser(
        description="Replicafit - AI Exercise Recorder with MediaPipe",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py record                    Record with interactive exercise selection
  python main.py record --exercise squat   Record squats
  python main.py list                      List all recorded sessions
  python main.py analyze session_id        Analyze a specific session
  python main.py progress                  Show progress across all sessions
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    record_parser = subparsers.add_parser("record", help="Record an exercise session")
    record_parser.add_argument(
        "-e",
        "--exercise",
        type=str,
        choices=list(EXERCISE_INFO.keys()),
        help="Exercise to record (default: interactive selection)",
    )
    record_parser.add_argument(
        "-d",
        "--duration",
        type=int,
        help="Recording duration in seconds (default: unlimited)",
    )
    record_parser.add_argument(
        "-o", "--output", type=str, help="Output file path (default: auto-generated)"
    )

    analyze_parser = subparsers.add_parser("analyze", help="Analyze a recorded session")
    analyze_parser.add_argument(
        "session_id", type=str, nargs="?", help="Session ID to analyze"
    )
    analyze_parser.add_argument("--file", type=str, help="Path to session JSON file")

    progress_parser = subparsers.add_parser(
        "progress", help="Show progress across all sessions"
    )

    list_parser = subparsers.add_parser("list", help="List all recorded sessions")

    args = parser.parse_args()

    if args.command == "record":
        record_session(args)
    elif args.command == "analyze":
        analyze_session(args)
    elif args.command == "progress":
        show_progress(args)
    elif args.command == "list":
        list_all_sessions(args)
    else:
        parser.print_help()


def record_session(args):
    exercise_name = args.exercise

    if not exercise_name:
        print("\n" + "=" * 50)
        print("REPLICAFIT EXERCISE RECORDER")
        print("=" * 50)
        exercise_name = select_exercise()

    print(f"\nStarting recording for: {EXERCISE_INFO[exercise_name]['name']}")

    recorder = ExerciseRecorder(exercise_name)
    recorder.record(duration=args.duration)
    recorder.print_summary()

    save = input("Save session? (Y/n): ").strip().lower()
    if save != "n":
        filepath = recorder.save(args.output)
        print(f"Session saved to: {filepath}")
    else:
        print("Session discarded.")


def analyze_session(args):
    if args.file:
        filepath = args.file
    elif args.session_id:
        from config import RECORDINGS_DIR

        filepath = f"{RECORDINGS_DIR}/{args.session_id}*.json"
        from pathlib import Path

        matches = list(Path(RECORDINGS_DIR).glob(f"{args.session_id}_*.json"))
        if matches:
            filepath = str(matches[0])
        else:
            print(f"Session not found: {args.session_id}")
            print("Use 'python main.py list' to see available sessions")
            return
    else:
        print("Please provide a session ID or file path")
        return

    try:
        analytics = SessionAnalytics(filepath)
        analytics.print_full_report()
    except FileNotFoundError:
        print(f"File not found: {filepath}")
    except Exception as e:
        print(f"Error analyzing session: {e}")


def show_progress(args):
    tracker = ProgressTracker()
    tracker.print_progress_report()


def list_all_sessions(args):
    list_sessions()


if __name__ == "__main__":
    main()
