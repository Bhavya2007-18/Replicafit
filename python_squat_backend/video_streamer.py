import cv2
import time
import threading
import mediapipe as mp
from pose_detector import PoseDetector
from squat_analyzer import SquatAnalyzer

class VideoStreamer:
    def __init__(self):
        self.detector = PoseDetector()
        self.analyzer = SquatAnalyzer()
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.lock = threading.Lock()
        self.latest_frame = None
        self.fps = 0
        
        # Shared metrics
        self.reps = 0
        self.state = 'STANDING'
        self.feedback = []
        self.tempo = 0
        self.score = 0
        self.depth_progress = 0
        
        # Start capture thread to prevent IO blocking
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        prev_time = time.time()
        while True:
            success, img = self.cap.read()
            if not success: continue
            
            img = cv2.flip(img, 1)
            h, w, c = img.shape
            timestamp_ms = int(time.time() * 1000)
            
            results = self.detector.process(img, timestamp_ms)
            lm_dict = self.detector.extract_landmarks(results, w, h)
            
            analysis = self.analyzer.update(lm_dict)
            
            # Update shared state
            with self.lock:
                self.reps = self.analyzer.reps
                self.state = self.analyzer.state
                self.feedback = self.analyzer.feedback
                self.tempo = self.analyzer.tempo
                self.score = int(sum(self.analyzer.scores_history)/len(self.analyzer.scores_history)) if self.analyzer.scores_history else 0
                if analysis:
                    self.depth_progress = analysis["progress"]
                    
            # Draw Skeleton based on new API format
            if results and results.pose_landmarks:
                is_correct = len(self.analyzer.feedback) == 0
                c_color = (0, 255, 0) if is_correct else (0, 0, 255)
                
                from mediapipe.framework.formats import landmark_pb2
                landmarks_proto = landmark_pb2.NormalizedLandmarkList()
                landmarks_proto.landmark.extend([
                  landmark_pb2.NormalizedLandmark(x=landmark.x, y=landmark.y, z=landmark.z, visibility=landmark.visibility) 
                  for landmark in results.pose_landmarks[0]
                ])

                mp.solutions.drawing_utils.draw_landmarks(
                    img, landmarks_proto, mp.solutions.pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(color=(255,165,0), thickness=2, circle_radius=2),
                    connection_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(color=c_color, thickness=2)
                )

            # FPS
            curr_time = time.time()
            self.fps = int(1 / (curr_time - prev_time + 0.0001))
            prev_time = curr_time
            cv2.putText(img, f"FPS: {self.fps}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            ret, buffer = cv2.imencode('.jpg', img)
            if ret:
                self.latest_frame = buffer.tobytes()

    def get_frame(self):
        while True:
            time.sleep(0.03) # Cap to 30 FPS stream
            if self.latest_frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + self.latest_frame + b'\r\n')
