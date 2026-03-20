import cv2
import mediapipe as mp
import numpy as np
import time
import math
import pyttsx3
import threading
import json
from collections import deque

# ==========================================
# 1. NOISE REDUCTION & SMOOTHING
# ==========================================
class SmoothingFilter:
    """Applies a moving average to reduce jitter in landmark coordinates and angles."""
    def __init__(self, window_size=5):
        self.window_size = window_size
        self.history = {}

    def smooth(self, key, value):
        if key not in self.history:
            self.history[key] = deque(maxlen=self.window_size)
        self.history[key].append(value)
        return sum(self.history[key]) / len(self.history[key])

# ==========================================
# 2. MULTI-JOINT BIOMECHANICS ANALYSIS
# ==========================================
class AngleCalculator:
    """Computes normalized angles between three spatial coordinates."""
    @staticmethod
    def calculate_angle(a, b, c):
        a, b, c = np.array(a), np.array(b), np.array(c)
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle

# ==========================================
# 3. POSE DETECTION ENGINE
# ==========================================
class PoseDetector:
    """Wraps MediaPipe Pose for reliable landmark extraction."""
    def __init__(self, min_detection_confidence=0.7, min_tracking_confidence=0.7):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=min_detection_confidence, 
            min_tracking_confidence=min_tracking_confidence
        )
        self.mp_draw = mp.solutions.drawing_utils

    def process_frame(self, img):
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.pose.process(img_rgb)
        return results
        
    def extract_landmarks(self, results, w, h):
        lm_dict = {}
        if results.pose_landmarks:
            for id, lm in enumerate(results.pose_landmarks.landmark):
                cx, cy = int(lm.x * w), int(lm.y * h)
                lm_dict[id] = (cx, cy, lm.visibility)
        return lm_dict

# ==========================================
# 4. AUDIO FEEDBACK SYSTEM
# ==========================================
class FeedbackSystem:
    """Non-blocking text-to-speech engine for real-time coaching commands."""
    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 180) # Faster speech
        self.is_speaking = False
        
    def speak(self, text):
        if not self.is_speaking:
            t = threading.Thread(target=self._speak_thread, args=(text,))
            t.start()
            
    def _speak_thread(self, text):
        self.is_speaking = True
        self.engine.say(text)
        self.engine.runAndWait()
        self.is_speaking = False

# ==========================================
# 5. ADVANCED SQUAT STATE MACHINE & ANALYZER
# ==========================================
class SquatAnalyzer:
    def __init__(self):
        # Kinematic State Machine
        self.state = 'STANDING' # STANDING -> DESCENDING -> BOTTOM -> ASCENDING
        
        # Thresholds (Angles in degrees)
        self.T_STAND = 160
        self.T_DESCEND = 140
        self.T_BOTTOM = 95       # Deep squat threshold
        
        # Metrics
        self.reps = 0
        self.tempo = 0
        self.rep_start_time = 0
        self.depth_score = 0
        self.rep_scores = []
        
        # Active rep anomalies
        self.active_issues = set()
        self.feedback_msgs = []
        
        # Submodules
        self.smoother = SmoothingFilter()
        self.voice = FeedbackSystem()

    def update(self, lm_dict):
        self.feedback_msgs = []
        self.active_issues = set()
        
        if not lm_dict:
            return None
            
        try:
            # 1. VISIBILITY CHECK
            # Check if hip, knee, and ankle are visible (confidence > 0.4)
            if lm_dict[23][2] < 0.4 or lm_dict[25][2] < 0.4 or lm_dict[27][2] < 0.4:
                self.feedback_msgs.append("POSITION ENTIRE BODY IN FRAME")
                return None
                
            # 2. EXTRACT JOINTS
            # Shoulders (11, 12), Hips (23, 24), Knees (25, 26), Ankles (27, 28)
            r_shoulder, l_shoulder = lm_dict[12][:2], lm_dict[11][:2]
            r_hip,      l_hip      = lm_dict[24][:2], lm_dict[23][:2]
            r_knee,     l_knee     = lm_dict[26][:2], lm_dict[25][:2]
            r_ankle,    l_ankle    = lm_dict[28][:2], lm_dict[27][:2]
            
            # 3. CALCULATE RAW ANGLES
            r_knee_angle = AngleCalculator.calculate_angle(r_hip, r_knee, r_ankle)
            l_knee_angle = AngleCalculator.calculate_angle(l_hip, l_knee, l_ankle)
            
            # Back angle uses a purely vertical reference line dropping from the hip
            r_back_angle = AngleCalculator.calculate_angle(r_shoulder, r_hip, (r_hip[0], r_hip[1]-100))
            l_back_angle = AngleCalculator.calculate_angle(l_shoulder, l_hip, (l_hip[0], l_hip[1]-100))
            
            # 4. NOISE REDUCTION
            r_k = self.smoother.smooth('r_knee', r_knee_angle)
            l_k = self.smoother.smooth('l_knee', l_knee_angle)
            r_b = self.smoother.smooth('r_back', r_back_angle)
            
            avg_knee = (r_k + l_k) / 2
            
            # 5. SYMMETRY & BIOMECHANIC FORM RULES
            symmetry_diff = abs(r_k - l_k)
            knee_dist = abs(r_knee[0] - l_knee[0])
            ankle_dist = abs(r_ankle[0] - l_ankle[0])
            
            # Knee tracking: Knees collapsing inward (valgus)
            if knee_dist < ankle_dist * 0.7:
                self.feedback_msgs.append("KEEP KNEES ALIGNED OUTWARD")
                self.active_issues.add("Valgus")
                self.voice.speak("Push knees out")

            # Symmetry: Weight shifting
            if symmetry_diff > 15:
                self.feedback_msgs.append("IMBALANCE: DISTRIBUTE WEIGHT EVENLY")
                self.active_issues.add("Symmetry")
                
            # Back stability: Leaning forward excessively
            if r_b > 45: 
                self.feedback_msgs.append("KEEP YOUR BACK STRAIGHT")
                self.active_issues.add("Back")

            # Heels lifting
            if r_ankle[1] < r_hip[1] + 50: # Simplistic check, realistically requires feet tracking
                pass 
                
            # 6. SQUAT KINEMATIC STATE MACHINE
            if self.state == 'STANDING':
                if avg_knee < self.T_DESCEND:
                    self.state = 'DESCENDING'
                    self.rep_start_time = time.time()
                    self.depth_score = 0
                    
            elif self.state == 'DESCENDING':
                if avg_knee < self.T_BOTTOM:
                    self.state = 'BOTTOM'
                    self.depth_score = int(np.clip(100 - (avg_knee - 60), 0, 100))
                elif avg_knee > self.T_STAND:
                    # Incomplete rep triggered (bounced too early)
                    self.feedback_msgs.append("INCOMPLETE REP: GO DEEPER")
                    self.voice.speak("Go deeper")
                    self.state = 'STANDING'
                    
            elif self.state == 'BOTTOM':
                # Track maximum depth reached
                self.depth_score = max(self.depth_score, int(np.clip(100 - (avg_knee - 60), 0, 100)))
                # Hysteresis: Ensure clear upward movement to exit bottom state
                if avg_knee > self.T_BOTTOM + 15: 
                    self.state = 'ASCENDING'
                    
            elif self.state == 'ASCENDING':
                if avg_knee > self.T_STAND:
                    self.state = 'STANDING'
                    self.reps += 1
                    self.tempo = round(time.time() - self.rep_start_time, 2)
                    
                    # Compute REP QUALITY SCORE (0-100)
                    quality = 100
                    if "Symmetry" in self.active_issues: quality -= 10
                    if "Back" in self.active_issues: quality -= 20
                    if "Valgus" in self.active_issues: quality -= 20
                    if self.depth_score < 70: quality -= 30
                    
                    final_score = max(0, quality)
                    self.rep_scores.append(final_score)
                    
                    # Analytics & Fatigue
                    if self.tempo > 5.0 and self.reps > 5:
                        self.voice.speak(f"{self.reps}. You are slowing down. Push through!")
                    else:
                        self.voice.speak(str(self.reps))
                        
            return {
                'avg_knee': avg_knee,
                'symmetry': symmetry_diff,
                'depth_score': self.depth_score
            }

        except Exception as e:
            return None

# ==========================================
# 6. APP CONTROLLER & VISUAL OVERLAY UI
# ==========================================
class SquatCoachApp:
    def __init__(self):
        self.detector = PoseDetector()
        self.analyzer = SquatAnalyzer()
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
    def draw_skeleton(self, img, results):
        if not results.pose_landmarks: 
            return
            
        # Color coding mechanism
        # Green = Correct form, Red = Incorrect 
        is_form_correct = len(self.analyzer.feedback_msgs) == 0
        skeleton_color = (0, 255, 0) if is_form_correct else (0, 0, 255)
        joint_color = (255, 165, 0) # Orange joints for visibility
        
        mp_draw = mp.solutions.drawing_utils
        mp_pose = mp.solutions.pose
        
        custom_style = mp_draw.DrawingSpec(color=skeleton_color, thickness=3, circle_radius=4)
        joint_style = mp_draw.DrawingSpec(color=joint_color, thickness=4, circle_radius=5)
        
        mp_draw.draw_landmarks(
            img, 
            results.pose_landmarks, 
            mp_pose.POSE_CONNECTIONS, 
            landmark_drawing_spec=joint_style,
            connection_drawing_spec=custom_style
        )

    def draw_hud(self, img, analysis_data):
        # 1. Base Dark HUD Box
        cv2.rectangle(img, (20, 20), (320, 160), (30, 30, 30), -1)
        cv2.rectangle(img, (20, 20), (320, 160), (200, 200, 200), 2)
        
        # 2. Key Metrics
        cv2.putText(img, "REPS", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        cv2.putText(img, str(self.analyzer.reps), (40, 120), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)
        
        cv2.putText(img, f"STATE: {self.analyzer.state}", (140, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(img, f"TEMPO: {self.analyzer.tempo}s", (140, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        avg_score = int(np.mean(self.analyzer.rep_scores)) if self.analyzer.rep_scores else 0
        cv2.putText(img, f"SCORE: {avg_score}/100", (140, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

        # 3. Form Feedback Warning Banner
        y_pos = 200
        for fb in self.analyzer.feedback_msgs:
            cv2.rectangle(img, (20, y_pos-25), (400, y_pos+10), (0, 0, 200), -1)
            cv2.putText(img, f"⚠️ {fb}", (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_pos += 45
            
        # 4. Squat Depth Progress Bar (Right side)
        if analysis_data:
            bar_x, bar_y, bar_w, bar_h = 1180, 200, 30, 300
            knee_angle = analysis_data['avg_knee']
            
            # Map knee angle (170 down to 80) to progress (0 to 1)
            progress = max(0, min(1, (170 - knee_angle) / 90))
            fill_h = int(progress * bar_h)
            
            bar_color = (0, 255, 0) if progress > 0.85 else (0, 165, 255) # Green if deep enough
            
            cv2.rectangle(img, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (100, 100, 100), 2)
            cv2.rectangle(img, (bar_x, bar_y + bar_h - fill_h), (bar_x + bar_w, bar_y + bar_h), bar_color, -1)
            cv2.putText(img, "DEPTH", (1165, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(img, f"{int(progress*100)}%", (1165, bar_y + bar_h + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    def log_session(self):
        """Dumps session analytics to a JSON file."""
        avg_score = int(np.mean(self.analyzer.rep_scores)) if self.analyzer.rep_scores else 0
        data = {
            "session_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_reps": self.analyzer.reps,
            "overall_quality_score": avg_score,
            "rep_history": self.analyzer.rep_scores
        }
        with open("squat_session_log.json", "w") as f:
            json.dump(data, f, indent=4)
        print("\n✅ Session data saved to squat_session_log.json")

    def run(self):
        print("Starting AI Squat Coach. Press 'Q' to exit and save session data.")
        while self.cap.isOpened():
            success, img = self.cap.read()
            if not success:
                break
                
            img = cv2.flip(img, 1) # Mirror for natural interaction
            h, w, _ = img.shape
            
            # Detect Pose
            results = self.detector.process_frame(img)
            lm_dict = self.detector.extract_landmarks(results, w, h)
            
            # Analyze Biomechanics
            analysis_data = self.analyzer.update(lm_dict)
            
            # Render UI
            self.draw_skeleton(img, results)
            self.draw_hud(img, analysis_data)
            
            cv2.imshow("Production AI Fitness Coach", img)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.log_session()
                break
                
        self.cap.release()
        cv2.destroyAllWindows()

# ==========================================
# BOOTSTRAP
# ==========================================
if __name__ == "__main__":
    app = SquatCoachApp()
    app.run()
