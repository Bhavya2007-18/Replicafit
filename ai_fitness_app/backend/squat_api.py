import numpy as np
import cv2
from utils.pose_detector import PoseDetector

class SquatAnalyzer:
    def __init__(self):
        # New PoseDetector doesn't take model_complexity in __init__
        self.detector = PoseDetector()
        self.count = 0
        self.direction = 0 # 0 for going down, 1 for going up
        self.feedback = "Ready"

    def process_frame(self, img):
        img = self.detector.find_pose(img, draw=False)
        lm_list = self.detector.get_position(img)
        
        if len(lm_list) >= 29: # Ensure we have enough landmarks for ankles
            # 24: Right Hip, 26: Right Knee, 28: Right Ankle
            # 23: Left Hip, 25: Left Knee, 27: Left Ankle
            angle_right = self.detector.calculate_angle(img, 24, 26, 28, lm_list, draw=True)
            angle_left = self.detector.calculate_angle(img, 23, 25, 27, lm_list, draw=True)
            
            # Use average angle
            angle = (angle_right + angle_left) / 2
            
            # Squat logic (approximated)
            # Standing straight ~ 170 deg, Squat deep ~ 90 deg or less
            percentage = np.interp(angle, (90, 160), (100, 0))
            
            # Logic: When percentage hits 90 it's a full squat, when it drops to 10 it's standing back up.
            if percentage >= 90:
                if self.direction == 0:
                    self.direction = 1
                    self.feedback = "Good depth, now up!"
            
            if percentage <= 10:
                if self.direction == 1:
                    self.count += 1
                    self.direction = 0
                    self.feedback = "Good rep!"
            
            # Draw UI on image
            cv2.rectangle(img, (0, 0), (300, 100), (45, 45, 45), cv2.FILLED)
            cv2.putText(img, f'Reps: {self.count}', (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.putText(img, self.feedback, (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        else:
            self.feedback = "Step back - full body not visible"
            cv2.rectangle(img, (0, 0), (450, 60), (0, 0, 255), cv2.FILLED)
            cv2.putText(img, self.feedback, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
        return img
