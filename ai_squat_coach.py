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
        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 180) # Faster speech
            self.enabled = True
        except Exception as e:
            print(f"⚠️ Audio Feedback Disabled: {str(e)}")
            self.enabled = False
        self.is_speaking = False
        self.last_speak_time = 0.0
        self.cooldown = 3.0  # 3 second cooldown between voice cues
        
    def speak(self, text):
        now = time.time()
        if self.enabled and not self.is_speaking and (now - self.last_speak_time) > self.cooldown:
            self.last_speak_time = now
            t = threading.Thread(target=self._speak_thread, args=(text,))
            t.start()
            
    def _speak_thread(self, text):
        self.is_speaking = True
        try:
            self.engine.say(text)
            self.engine.runAndWait()
        except:
            pass
        self.is_speaking = False

# ==========================================
# 5. BICEP CURL STATE MACHINE & ANALYZER
# ==========================================
class BicepCurlAnalyzer:
    def __init__(self):
        # Kinematic State Machines (per arm)
        self.left_state = 'DOWN'   # DOWN -> LIFTING -> TOP -> LOWERING -> DOWN
        self.right_state = 'DOWN'
        
        # Thresholds (Angles in degrees) with hysteresis
        self.T_DOWN = 160           # Arm fully extended
        self.T_DOWN_HYSTERESIS = 130  # Cross this on way down to count rep (was 150, too strict)
        self.T_LIFTING = 140        # Start of curl (angle dropping below this)
        self.T_TOP = 50             # Fully curled
        self.T_TOP_HYSTERESIS = 65  # Must cross this to confirm top reached
        
        # Metrics
        self.reps = 0
        self.left_reps = 0
        self.right_reps = 0
        self.tempo = 0
        self.left_rep_start = 0.0
        self.right_rep_start = 0.0
        self.rep_scores = []
        self.left_scores = []
        self.right_scores = []
        
        # Active rep anomalies
        self.active_issues = set()
        self.feedback_msgs = []
        
        # For swing detection: track shoulder Y over time
        self.left_shoulder_y_history = deque(maxlen=10)
        self.right_shoulder_y_history = deque(maxlen=10)
        
        # Submodules
        self.smoother = SmoothingFilter(window_size=5)
        self.voice = FeedbackSystem()
        
        # Overall display state (show whichever arm is actively curling)
        self.state = 'DOWN'

    def _update_arm(self, side, elbow_angle, elbow_pos, hip_pos, shoulder_pos, shoulder_y_history):
        """Process state machine for one arm. Returns True if a rep was completed."""
        arm_state = self.left_state if side == 'L' else self.right_state
        rep_start = self.left_rep_start if side == 'L' else self.right_rep_start
        rep_completed = False
        arm_issues = set()
        arm_feedback = []
        
        # ---- FORM CHECKS ----
        
        # 1. Elbow Drift: only flag when actively curling (not at rest)
        elbow_hip_x_dist = abs(elbow_pos[0] - hip_pos[0])
        if elbow_hip_x_dist > 120 and arm_state in ('LIFTING', 'TOP', 'LOWERING'):
            arm_feedback.append(f"KEEP {side} ELBOW CLOSE")
            arm_issues.add("ElbowDrift")
        
        # 2. Swing / Momentum: excessive shoulder vertical movement
        shoulder_y_history.append(shoulder_pos[1])
        if len(shoulder_y_history) >= 5:
            shoulder_y_range = max(shoulder_y_history) - min(shoulder_y_history)
            if shoulder_y_range > 40:
                arm_feedback.append(f"STOP SWINGING ({side} ARM)")
                arm_issues.add("Swing")
        
        # 3. Incomplete Extension: at bottom, arm should be nearly straight
        if arm_state == 'DOWN' and elbow_angle < 155:
            arm_feedback.append(f"FULLY EXTEND {side} ARM")
            arm_issues.add("IncompleteExtension")
        
        # ---- STATE MACHINE ----
        
        if arm_state == 'DOWN':
            if elbow_angle < self.T_LIFTING:
                arm_state = 'LIFTING'
                rep_start = time.time()
                
        elif arm_state == 'LIFTING':
            if elbow_angle < self.T_TOP:
                arm_state = 'TOP'
            elif elbow_angle > self.T_DOWN:
                # Went back up without completing — partial rep
                arm_feedback.append(f"INCOMPLETE REP ({side})")
                arm_state = 'DOWN'
                
        elif arm_state == 'TOP':
            if elbow_angle > self.T_TOP_HYSTERESIS:
                arm_state = 'LOWERING'
                
        elif arm_state == 'LOWERING':
            if elbow_angle < self.T_TOP:
                # Dropped back to top — bounce
                arm_state = 'TOP'
            elif elbow_angle > self.T_DOWN_HYSTERESIS:
                arm_state = 'DOWN'
                rep_completed = True
                print(f"[REP] {side} arm rep complete! angle={elbow_angle:.1f}")
                
                # 4. Tempo check
                rep_time = time.time() - rep_start
                if rep_time < 1.2:
                    arm_feedback.append(f"SLOW DOWN ({side})")
                    arm_issues.add("TooFast")
        
        # Write back state
        if side == 'L':
            self.left_state = arm_state
            self.left_rep_start = rep_start
        else:
            self.right_state = arm_state
            self.right_rep_start = rep_start
        
        return rep_completed, arm_issues, arm_feedback, arm_state

    def update(self, lm_dict):
        self.feedback_msgs = []
        self.active_issues = set()
        
        if not lm_dict:
            return None
            
        try:
            # 1. VISIBILITY CHECK — leniently check shoulders, elbows, wrists, hips
            required = [11, 12, 13, 14, 15, 16, 23, 24]
            for idx in required:
                if idx not in lm_dict or lm_dict[idx][2] < 0.2:  # was 0.4 — too strict for wrists
                    self.feedback_msgs.append("POSITION UPPER BODY IN FRAME")
                    return None
            
            # 2. EXTRACT JOINTS
            # MediaPipe indices: 11=L_SHOULDER, 12=R_SHOULDER, 13=L_ELBOW, 14=R_ELBOW
            #                    15=L_WRIST, 16=R_WRIST, 23=L_HIP, 24=R_HIP
            l_shoulder = lm_dict[11][:2]
            r_shoulder = lm_dict[12][:2]
            l_elbow    = lm_dict[13][:2]
            r_elbow    = lm_dict[14][:2]
            l_wrist    = lm_dict[15][:2]
            r_wrist    = lm_dict[16][:2]
            l_hip      = lm_dict[23][:2]
            r_hip      = lm_dict[24][:2]
            
            # 3. CALCULATE ELBOW ANGLES (shoulder → elbow → wrist)
            l_elbow_angle = AngleCalculator.calculate_angle(l_shoulder, l_elbow, l_wrist)
            r_elbow_angle = AngleCalculator.calculate_angle(r_shoulder, r_elbow, r_wrist)
            
            # 4. NOISE REDUCTION
            l_angle_smooth = self.smoother.smooth('l_elbow', l_elbow_angle)
            r_angle_smooth = self.smoother.smooth('r_elbow', r_elbow_angle)
            
            # 5. PROCESS EACH ARM
            l_rep, l_issues, l_feedback, l_arm_state = self._update_arm(
                'L', l_angle_smooth, l_elbow, l_hip, l_shoulder, self.left_shoulder_y_history
            )
            r_rep, r_issues, r_feedback, r_arm_state = self._update_arm(
                'R', r_angle_smooth, r_elbow, r_hip, r_shoulder, self.right_shoulder_y_history
            )
            
            # 6. AGGREGATE RESULTS
            self.active_issues = l_issues | r_issues
            self.feedback_msgs.extend(l_feedback)
            self.feedback_msgs.extend(r_feedback)
            
            if l_rep:
                self.left_reps += 1
                self.reps += 1
                l_score = self._calculate_score(l_issues)
                self.left_scores.append(l_score)
                self.rep_scores.append(l_score)
                self.tempo = round(time.time() - self.left_rep_start, 2) if self.left_rep_start else 0
                self.voice.speak(str(self.reps))
                
            if r_rep:
                self.right_reps += 1
                self.reps += 1
                r_score = self._calculate_score(r_issues)
                self.right_scores.append(r_score)
                self.rep_scores.append(r_score)
                self.tempo = round(time.time() - self.right_rep_start, 2) if self.right_rep_start else 0
                self.voice.speak(str(self.reps))
            
            # 7. ARM IMBALANCE CHECK
            if self.left_reps > 0 and self.right_reps > 0:
                imbalance = abs(self.left_reps - self.right_reps)
                if imbalance >= 3:
                    weaker = "LEFT" if self.left_reps < self.right_reps else "RIGHT"
                    self.feedback_msgs.append(f"IMBALANCE: {weaker} ARM IS BEHIND")
            
            # Display state: show the more active arm's state
            if l_arm_state != 'DOWN':
                self.state = l_arm_state
            elif r_arm_state != 'DOWN':
                self.state = r_arm_state
            else:
                self.state = 'DOWN'
            
            # Average angle for progress bar (use the arm that's more curled)
            active_angle = min(l_angle_smooth, r_angle_smooth)
            
            return {
                'active_angle': active_angle,
                'l_angle': l_angle_smooth,
                'r_angle': r_angle_smooth,
                'l_reps': self.left_reps,
                'r_reps': self.right_reps
            }

        except Exception as e:
            return None
    
    def _calculate_score(self, issues):
        """Compute rep quality score 0-100."""
        quality = 100
        if "ElbowDrift" in issues: quality -= 25
        if "Swing" in issues: quality -= 25
        if "IncompleteExtension" in issues: quality -= 20
        if "TooFast" in issues: quality -= 15
        return max(0, quality)

# ==========================================
# 6. APP CONTROLLER & VISUAL OVERLAY UI
# ==========================================
class BicepCurlCoachApp:
    def __init__(self):
        self.detector = PoseDetector()
        self.analyzer = BicepCurlAnalyzer()
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
        h, w = img.shape[:2]
        
        # 1. Base Dark HUD Box
        cv2.rectangle(img, (20, 20), (350, 220), (30, 30, 30), -1)
        cv2.rectangle(img, (20, 20), (350, 220), (200, 200, 200), 2)
        
        # 2. Key Metrics
        cv2.putText(img, "BICEP CURL COACH", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        cv2.putText(img, "REPS", (40, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        cv2.putText(img, str(self.analyzer.reps), (40, 140), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)
        
        cv2.putText(img, f"STATE: {self.analyzer.state}", (160, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(img, f"TEMPO: {self.analyzer.tempo}s", (160, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        avg_score = int(np.mean(self.analyzer.rep_scores)) if self.analyzer.rep_scores else 0
        cv2.putText(img, f"SCORE: {avg_score}/100", (160, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
        
        # Per-arm rep counts
        cv2.putText(img, f"L: {self.analyzer.left_reps}  R: {self.analyzer.right_reps}", (160, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 2)

        # 3. Form Feedback Warning Banner
        y_pos = 260
        for fb in self.analyzer.feedback_msgs:
            cv2.rectangle(img, (20, y_pos-25), (500, y_pos+10), (0, 0, 200), -1)
            cv2.putText(img, f"  {fb}", (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            y_pos += 45
            
        # 4. Curl Progress Bar (Right side)
        if analysis_data:
            bar_x = w - 100
            bar_y, bar_w, bar_h = 200, 30, 300
            active_angle = analysis_data['active_angle']
            
            # Map elbow angle (180 fully extended → 30 fully curled) to progress (0 → 1)
            progress = max(0, min(1, (180 - active_angle) / 150))
            fill_h = int(progress * bar_h)
            
            bar_color = (0, 255, 0) if progress > 0.85 else (0, 165, 255)
            
            cv2.rectangle(img, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (100, 100, 100), 2)
            cv2.rectangle(img, (bar_x, bar_y + bar_h - fill_h), (bar_x + bar_w, bar_y + bar_h), bar_color, -1)
            cv2.putText(img, "CURL", (bar_x - 10, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(img, f"{int(progress*100)}%", (bar_x - 10, bar_y + bar_h + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Elbow angle readouts
            cv2.putText(img, f"L: {int(analysis_data['l_angle'])} deg", (bar_x - 50, bar_y + bar_h + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
            cv2.putText(img, f"R: {int(analysis_data['r_angle'])} deg", (bar_x - 50, bar_y + bar_h + 85), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

    def log_session(self):
        """Dumps session analytics to a JSON file."""
        avg_score = int(np.mean(self.analyzer.rep_scores)) if self.analyzer.rep_scores else 0
        data = {
            "session_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "exercise": "bicep_curl",
            "total_reps": self.analyzer.reps,
            "left_reps": self.analyzer.left_reps,
            "right_reps": self.analyzer.right_reps,
            "overall_quality_score": avg_score,
            "rep_history": self.analyzer.rep_scores
        }
        with open("curl_session_log.json", "w") as f:
            json.dump(data, f, indent=4)
        print("\n✅ Session data saved to curl_session_log.json")

    def run(self):
        print("Starting AI Bicep Curl Coach. Press 'Q' to exit and save session data.")
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
            
            cv2.imshow("AI Bicep Curl Coach", img)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.log_session()
                break
                
        self.cap.release()
        cv2.destroyAllWindows()

# ==========================================
# BOOTSTRAP
# ==========================================
if __name__ == "__main__":
    app = BicepCurlCoachApp()
    app.run()
