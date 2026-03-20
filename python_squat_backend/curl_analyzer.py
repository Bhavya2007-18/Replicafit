import time
import numpy as np
from collections import deque
from utils import calculate_angle, Smoother
import pyttsx3
import threading

class VoiceCoach:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.is_speaking = False
        self.last_speak_time = 0.0
        self.cooldown = 3.0  # seconds between voice cues
        
    def speak(self, text):
        now = time.time()
        if not self.is_speaking and (now - self.last_speak_time) > self.cooldown:
            self.last_speak_time = now
            threading.Thread(target=self._speak, args=(text,), daemon=True).start()
            
    def _speak(self, text):
        self.is_speaking = True
        self.engine.say(text)
        self.engine.runAndWait()
        self.is_speaking = False

class BicepCurlAnalyzer:
    def __init__(self):
        # Per-arm state machines
        self.left_state = 'DOWN'   # DOWN -> LIFTING -> TOP -> LOWERING -> DOWN
        self.right_state = 'DOWN'
        
        # Thresholds with hysteresis
        self.T_DOWN = 160
        self.T_DOWN_HYSTERESIS = 150
        self.T_LIFTING = 140
        self.T_TOP = 50
        self.T_TOP_HYSTERESIS = 60
        
        # Metrics
        self.reps = 0
        self.left_reps = 0
        self.right_reps = 0
        self.tempo = 0
        self.left_rep_start = 0.0
        self.right_rep_start = 0.0
        self.score = 100
        self.feedback = []
        self.smoother = Smoother(window=5)
        self.coach = VoiceCoach()
        
        self.active_issues = set()
        self.scores_history = []
        
        # Swing detection
        self.left_shoulder_y_history = deque(maxlen=10)
        self.right_shoulder_y_history = deque(maxlen=10)
        
        # Display state
        self.state = 'DOWN'

    def _update_arm(self, side, elbow_angle, elbow_pos, hip_pos, shoulder_pos, shoulder_y_history):
        """Process state machine for one arm. Returns (rep_completed, issues, feedback, arm_state)."""
        arm_state = self.left_state if side == 'L' else self.right_state
        rep_start = self.left_rep_start if side == 'L' else self.right_rep_start
        rep_completed = False
        arm_issues = set()
        arm_feedback = []
        
        # --- FORM CHECKS ---
        
        # 1. Elbow drift
        if abs(elbow_pos[0] - hip_pos[0]) > 80:
            arm_feedback.append(f"Keep {side} elbow close")
            arm_issues.add("ElbowDrift")
        
        # 2. Swing / momentum
        shoulder_y_history.append(shoulder_pos[1])
        if len(shoulder_y_history) >= 5:
            if max(shoulder_y_history) - min(shoulder_y_history) > 40:
                arm_feedback.append(f"Stop swinging ({side})")
                arm_issues.add("Swing")
        
        # 3. Incomplete extension
        if arm_state == 'DOWN' and elbow_angle < 155:
            arm_feedback.append(f"Fully extend {side} arm")
            arm_issues.add("IncompleteExtension")
        
        # --- STATE MACHINE ---
        
        if arm_state == 'DOWN':
            if elbow_angle < self.T_LIFTING:
                arm_state = 'LIFTING'
                rep_start = time.time()
                
        elif arm_state == 'LIFTING':
            if elbow_angle < self.T_TOP:
                arm_state = 'TOP'
            elif elbow_angle > self.T_DOWN:
                arm_feedback.append(f"Incomplete rep ({side})")
                arm_state = 'DOWN'
                
        elif arm_state == 'TOP':
            if elbow_angle > self.T_TOP_HYSTERESIS:
                arm_state = 'LOWERING'
                
        elif arm_state == 'LOWERING':
            if elbow_angle < self.T_TOP:
                arm_state = 'TOP'
            elif elbow_angle > self.T_DOWN_HYSTERESIS:
                arm_state = 'DOWN'
                rep_completed = True
                rep_time = time.time() - rep_start
                if rep_time < 1.5:
                    arm_feedback.append(f"Slow down ({side})")
                    arm_issues.add("TooFast")
        
        # Write back
        if side == 'L':
            self.left_state = arm_state
            self.left_rep_start = rep_start
        else:
            self.right_state = arm_state
            self.right_rep_start = rep_start
        
        return rep_completed, arm_issues, arm_feedback, arm_state

    def update(self, lm_dict):
        self.feedback = []
        self.active_issues.clear()
        
        if not lm_dict:
            return None
            
        try:
            # Visibility check
            required = [11, 12, 13, 14, 15, 16, 23, 24]
            for idx in required:
                if idx not in lm_dict or lm_dict[idx][2] < 0.4:
                    self.feedback.append("Position upper body in frame")
                    return None
            
            # Extract joints
            l_shoulder = lm_dict[11][:2]
            r_shoulder = lm_dict[12][:2]
            l_elbow    = lm_dict[13][:2]
            r_elbow    = lm_dict[14][:2]
            l_wrist    = lm_dict[15][:2]
            r_wrist    = lm_dict[16][:2]
            l_hip      = lm_dict[23][:2]
            r_hip      = lm_dict[24][:2]
            
            # Elbow angles (shoulder → elbow → wrist)
            l_angle_raw = calculate_angle(l_shoulder, l_elbow, l_wrist)
            r_angle_raw = calculate_angle(r_shoulder, r_elbow, r_wrist)
            
            # Smoothing
            l_angle = self.smoother.smooth('l_elbow', l_angle_raw)
            r_angle = self.smoother.smooth('r_elbow', r_angle_raw)
            
            # Process each arm
            l_rep, l_issues, l_fb, l_arm_state = self._update_arm(
                'L', l_angle, l_elbow, l_hip, l_shoulder, self.left_shoulder_y_history
            )
            r_rep, r_issues, r_fb, r_arm_state = self._update_arm(
                'R', r_angle, r_elbow, r_hip, r_shoulder, self.right_shoulder_y_history
            )
            
            self.active_issues = l_issues | r_issues
            self.feedback.extend(l_fb)
            self.feedback.extend(r_fb)
            
            if l_rep:
                self.left_reps += 1
                self.reps += 1
                self._calculate_score(l_issues)
                self.coach.speak(str(self.reps))
                
            if r_rep:
                self.right_reps += 1
                self.reps += 1
                self._calculate_score(r_issues)
                self.coach.speak(str(self.reps))
            
            # Imbalance
            if self.left_reps > 0 and self.right_reps > 0:
                if abs(self.left_reps - self.right_reps) >= 3:
                    weaker = "LEFT" if self.left_reps < self.right_reps else "RIGHT"
                    self.feedback.append(f"Imbalance: {weaker} arm behind")
            
            # Display state
            if l_arm_state != 'DOWN':
                self.state = l_arm_state
            elif r_arm_state != 'DOWN':
                self.state = r_arm_state
            else:
                self.state = 'DOWN'
            
            active_angle = min(l_angle, r_angle)
            progress = max(0, min(100, int((180 - active_angle) / 150 * 100)))

            return {
                "active_angle": active_angle,
                "progress": progress,
                "l_angle": l_angle,
                "r_angle": r_angle,
            }
        except Exception as e:
            return None

    def _calculate_score(self, issues):
        q = 100
        if "ElbowDrift" in issues: q -= 25
        if "Swing" in issues: q -= 25
        if "IncompleteExtension" in issues: q -= 20
        if "TooFast" in issues: q -= 15
        self.score = max(0, q)
        self.scores_history.append(self.score)
