from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import threading
import mediapipe as mp
from ai_squat_coach import PoseDetector, SquatAnalyzer

app = Flask(__name__)
# Enable CORS to allow a frontend webpage on a different port/host to fetch data
CORS(app)

latest_metrics = {
    "reps": 0,
    "state": "STANDING",
    "feedback": [],
    "tempo": 0,
    "score": 0,
    "depth": 0,
    "error": "Initializing..."
}

class VideoStreamer:
    def __init__(self):
        self.detector = PoseDetector()
        self.analyzer = SquatAnalyzer()
        self.cap = cv2.VideoCapture(0)
        # Thread lock for safe read/write of metrics across Flask routes
        self.lock = threading.Lock()
        
    def generate_frames(self):
        global latest_metrics
        while True:
            success, img = self.cap.read()
            if not success:
                with self.lock:
                    latest_metrics["error"] = "Camera not available"
                break
                
            # Mirror frame for natural interacting
            img = cv2.flip(img, 1)
            h, w, c = img.shape
            
            # Predict
            results = self.detector.process_frame(img)
            lm_dict = self.detector.extract_landmarks(results, w, h)
            
            # Run the Squat Machine 
            analysis_data = self.analyzer.update(lm_dict)
            
            # Update metrics atomically for the /metrics JSON endpoint
            with self.lock:
                if not lm_dict:
                    latest_metrics["error"] = "No user detected"
                else:
                    latest_metrics["error"] = None
                    latest_metrics["reps"] = self.analyzer.reps
                    latest_metrics["state"] = self.analyzer.state
                    latest_metrics["feedback"] = self.analyzer.feedback_msgs
                    latest_metrics["tempo"] = self.analyzer.tempo
                    
                    scores = self.analyzer.rep_scores
                    latest_metrics["score"] = int(sum(scores)/len(scores)) if scores else 0
                    if analysis_data:
                        latest_metrics["depth"] = analysis_data.get("depth_score", 0)

            # Draw the real-time Semantic Skeleton
            if results.pose_landmarks:
                is_correct = len(self.analyzer.feedback_msgs) == 0
                skel_color = (0, 255, 0) if is_correct else (0, 0, 255)
                
                mp.solutions.drawing_utils.draw_landmarks(
                    img, results.pose_landmarks, mp.solutions.pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(color=(255,165,0), thickness=3, circle_radius=4),
                    connection_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(color=skel_color, thickness=3)
                )

            # Convert to Motion-JPEG chunk (vital for smooth HTML video streaming)
            ret, buffer = cv2.imencode('.jpg', img)
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

streamer = VideoStreamer()

@app.route('/video_feed')
def video_feed():
    """Streams live MJPEG video."""
    return Response(streamer.generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/metrics')
def metrics():
    """Returns ultra-fast real-time telemetry."""
    with streamer.lock:
        return jsonify(latest_metrics)

if __name__ == '__main__':
    # Run fully threaded to prevent frame-processing from blocking the JSON pollers
    print("🚀 Video API active at /video_feed")
    print("🚀 Metric API active at /metrics")
    app.run(host='0.0.0.0', port=5000, threaded=True)
