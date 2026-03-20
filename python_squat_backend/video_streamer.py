import cv2
import time
import threading
import queue
import mediapipe as mp
from pose_detector import PoseDetector
from curl_analyzer import BicepCurlAnalyzer
from mediapipe.framework.formats import landmark_pb2

class VideoStreamer:
    """
    3-THREAD PIPELINE for zero-latency analysis:
      Thread 1 (capture)  – grabs frames from webcam as fast as possible,
                            drops stale frames so analysis is never backlogged.
      Thread 2 (analyze)  – runs MediaPipe + BicepCurlAnalyzer on the latest frame.
      Thread 3 (encode)   – draws skeleton + overlays and JPEG-encodes for streaming.

    The threads communicate via single-slot queues (maxsize=1) so slow stages
    never accumulate a backlog — old frames are discarded instead.
    """

    def __init__(self):
        self.detector = PoseDetector()
        self.analyzer = BicepCurlAnalyzer()

        # Camera — run at 640×480, let OpenCV buffer only 1 frame
        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS,           30)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE,     1)     # ← key: never queue old frames

        self.lock = threading.Lock()
        self.latest_frame = None

        # Single-slot queues: if full the producer drops the old item
        self._raw_q       = queue.Queue(maxsize=1)
        self._results_q   = queue.Queue(maxsize=1)

        # Shared metrics
        self.reps        = 0
        self.left_reps   = 0
        self.right_reps  = 0
        self.state       = 'DOWN'
        self.feedback    = []
        self.tempo       = 0
        self.score       = 0
        self.curl_progress = 0
        self.rep_quality = 'N/A'
        self.l_angle     = 180.0
        self.r_angle     = 180.0
        self.fps         = 0

        for target in (self._capture_thread, self._analyze_thread, self._encode_thread):
            threading.Thread(target=target, daemon=True).start()

    # ------------------------------------------------------------------
    # Thread 1 – CAPTURE
    # ------------------------------------------------------------------
    def _capture_thread(self):
        while True:
            ok, img = self.cap.read()
            if not ok:
                continue
            img = cv2.flip(img, 1)
            # Drop stale frame so analysis is always current
            try:
                self._raw_q.put_nowait(img)
            except queue.Full:
                try:
                    self._raw_q.get_nowait()
                except queue.Empty:
                    pass
                self._raw_q.put_nowait(img)

    # ------------------------------------------------------------------
    # Thread 2 – ANALYZE (MediaPipe + curl logic)
    # ------------------------------------------------------------------
    def _analyze_thread(self):
        prev_t = time.time()
        while True:
            img = self._raw_q.get()

            # Resize to 320×240 for inference — 4× fewer pixels = 4× faster
            small = cv2.resize(img, (320, 240))
            h_s, w_s = small.shape[:2]
            timestamp_ms = int(time.time() * 1000)

            results  = self.detector.process(small, timestamp_ms)
            lm_dict  = self.detector.extract_landmarks(results, w_s, h_s)
            analysis = self.analyzer.update(lm_dict)

            # Update shared metrics immediately
            with self.lock:
                self.reps        = self.analyzer.reps
                self.left_reps   = self.analyzer.left_reps
                self.right_reps  = self.analyzer.right_reps
                self.state       = self.analyzer.state
                self.feedback    = list(self.analyzer.feedback)
                self.tempo       = self.analyzer.tempo
                self.score       = (int(sum(self.analyzer.scores_history) /
                                    len(self.analyzer.scores_history))
                                    if self.analyzer.scores_history else 0)
                if self.analyzer.scores_history:
                    s = self.analyzer.scores_history[-1]
                    self.rep_quality = ('Perfect' if s >= 95 else
                                        'Good'    if s >= 75 else
                                        'Fair'    if s >= 50 else 'Poor')
                if analysis:
                    self.curl_progress = analysis.get('progress', 0)
                    self.l_angle       = analysis.get('l_angle',  180.0)
                    self.r_angle       = analysis.get('r_angle',  180.0)

            # FPS based on analysis rate
            curr_t = time.time()
            with self.lock:
                self.fps = int(1 / (curr_t - prev_t + 1e-9))
            prev_t = curr_t

            # Pass original-resolution frame + results to encoder
            try:
                self._results_q.put_nowait((img, results, self.analyzer.feedback[:]))
            except queue.Full:
                try:
                    self._results_q.get_nowait()
                except queue.Empty:
                    pass
                self._results_q.put_nowait((img, results, self.analyzer.feedback[:]))

    # ------------------------------------------------------------------
    # Thread 3 – ENCODE (draw skeleton + JPEG)
    # ------------------------------------------------------------------
    def _encode_thread(self):
        prev_t = time.time()
        while True:
            img, results, feedback = self._results_q.get()
            h, w = img.shape[:2]

            # Draw skeleton on full-res frame
            if results and results.pose_landmarks:
                is_correct = len(feedback) == 0
                c_color = (0, 230, 80) if is_correct else (30, 30, 255)

                lm_proto = landmark_pb2.NormalizedLandmarkList()
                lm_proto.landmark.extend([
                    landmark_pb2.NormalizedLandmark(
                        x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility)
                    for lm in results.pose_landmarks[0]
                ])
                mp.solutions.drawing_utils.draw_landmarks(
                    img, lm_proto, mp.solutions.pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(
                        color=(255, 140, 0), thickness=2, circle_radius=3),
                    connection_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(
                        color=c_color, thickness=2),
                )

            # Encode JPEG at quality=60 — sufficient for smooth streaming
            ret, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 60])
            if ret:
                self.latest_frame = buf.tobytes()

    # ------------------------------------------------------------------
    # Frame generator for Flask response
    # ------------------------------------------------------------------
    def get_frame(self):
        while True:
            if self.latest_frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n'
                       + self.latest_frame + b'\r\n')
            time.sleep(0.008)   # ~120 Hz ceiling — GPU/CPU bound in practice
