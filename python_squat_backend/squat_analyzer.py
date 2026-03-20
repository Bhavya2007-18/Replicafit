import time
import numpy as np
from utils import calculate_angle, Smoother
import pyttsx3
import threading

class VoiceCoach:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.is_speaking = False
        
    def speak(self, text):
        if not self.is_speaking:
            threading.Thread(target=self._speak, args=(text,), daemon=True).start()
            
    def _speak(self, text):
        self.is_speaking = True
        self.engine.say(text)
        self.engine.runAndWait()
        self.is_speaking = False

class SquatAnalyzer:
    def __init__(self):
        self.state = 'STANDING'
        self.reps = 0
        self.tempo = 0
        self.rep_start = 0
        self.depth = 100
        self.score = 100
        self.feedback = []
        self.smoother = Smoother(window=5)
        self.coach = VoiceCoach()
        
        self.active_issues = set()
        self.scores_history = []

    def update(self, lm_dict):
        self.feedback = []
        self.active_issues.clear()
        
        if not lm_dict:
            return None
            
        try:
            # MediaPipe Pose Landmarks
            r_shoulder, l_shoulder = lm_dict[12][:2], lm_dict[11][:2]
            r_hip, l_hip = lm_dict[24][:2], lm_dict[23][:2]
            r_knee, l_knee = lm_dict[26][:2], lm_dict[25][:2]
            r_ankle, l_ankle = lm_dict[28][:2], lm_dict[27][:2]
            
            # Angles
            r_knee_ang = calculate_angle(r_hip, r_knee, r_ankle)
            l_knee_ang = calculate_angle(l_hip, l_knee, l_ankle)
            r_back_ang = calculate_angle(r_shoulder, r_hip, (r_hip[0], r_hip[1]-100))
            
            # Smoothing
            avg_knee = (r_knee_ang + l_knee_ang) / 2
            avg_knee = self.smoother.smooth('avg_knee', avg_knee)
            symmetry = abs(r_knee_ang - l_knee_ang)
            back_lean = self.smoother.smooth('back', r_back_ang)

            # Rules
            if back_lean > 45:
                self.feedback.append("Keep back straight")
                self.active_issues.add('back')
            if symmetry > 15:
                self.feedback.append("Balance weight evenly")
                self.active_issues.add('symmetry')
            
            # Knee tracking (Valgus)
            knee_dist = abs(r_knee[0] - l_knee[0])
            ankle_dist = abs(r_ankle[0] - l_ankle[0])
            if knee_dist < ankle_dist * 0.7:
                self.feedback.append("Push knees out")
                self.active_issues.add('valgus')

            # State Machine
            if self.state == 'STANDING':
                if avg_knee < 140:
                    self.state = 'DESCENDING'
                    self.rep_start = time.time()
                    self.depth = 100 # Reset (100 means not deep)
            elif self.state == 'DESCENDING':
                if avg_knee < 95:
                    self.state = 'BOTTOM'
                elif avg_knee > 160:
                    self.feedback.append("Go lower")
                    self.coach.speak("Go lower")
                    self.state = 'STANDING'
                self.depth = min(self.depth, avg_knee)
            elif self.state == 'BOTTOM':
                self.depth = min(self.depth, avg_knee)
                if avg_knee > 115:
                    self.state = 'ASCENDING'
            elif self.state == 'ASCENDING':
                if avg_knee < 95:
                    self.state = 'BOTTOM' # dropped back down
                elif avg_knee > 150:
                    self.state = 'STANDING'
                    self.reps += 1
                    self.tempo = round(time.time() - self.rep_start, 2)
                    self._calculate_score()
                    self.coach.speak(str(self.reps))

            # Live Depth visualization score (0-100)
            progress = max(0, min(100, int(100 - (avg_knee - 60) * 1.5)))

            return {
                "avg_knee": avg_knee,
                "progress": progress
            }
        except Exception as e:
            return None

    def _calculate_score(self):
        q = 100
        if 'back' in self.active_issues: q -= 20
        if 'symmetry' in self.active_issues: q -= 15
        if 'valgus' in self.active_issues: q -= 20
        if self.depth > 100: q -= 30 # Didn't go deep enough
        self.score = max(0, q)
        self.scores_history.append(self.score)
