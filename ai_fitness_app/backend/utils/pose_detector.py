import cv2
import mediapipe as mp
import numpy as np
import collections
import os
import urllib.request
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class PoseDetector:
    def __init__(self, model_path="pose_landmarker.task"):
        self.model_path = model_path
        self._ensure_model_exists()
        
        # Initialize MediaPipe Tasks
        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.detector = vision.PoseLandmarker.create_from_options(options)
        
        # Smoothing buffers for landmarks
        self.history = collections.defaultdict(lambda: collections.deque(maxlen=5))
        self.last_results = None

    def _ensure_model_exists(self):
        if not os.path.exists(self.model_path):
            print(f"Downloading MediaPipe model to {self.model_path}...")
            url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
            urllib.request.urlretrieve(url, self.model_path)
            print("Download complete.")

    def find_pose(self, img, draw=True):
        # MediaPipe Tasks expects RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        self.last_results = self.detector.detect(mp_image)
        
        if self.last_results.pose_landmarks and draw:
            self._draw_landmarks(img)
        return img

    def _draw_landmarks(self, img):
        # Draw connections manually as solutions.drawing_utils might be broken
        # Pose connections (simplified for primary logic)
        for pose_landmarks in self.last_results.pose_landmarks:
            for landmark in pose_landmarks:
                h, w, _ = img.shape
                cx, cy = int(landmark.x * w), int(landmark.y * h)
                cv2.circle(img, (cx, cy), 3, (0, 255, 0), cv2.FILLED)

    def get_position(self, img):
        lm_list = []
        if self.last_results and self.last_results.pose_landmarks:
            # We only use the first detected pose
            landmarks = self.last_results.pose_landmarks[0]
            for id, lm in enumerate(landmarks):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                
                # Apply simple smoothing for coordinates
                self.history[f'{id}_x'].append(cx)
                self.history[f'{id}_y'].append(cy)
                
                smooth_cx = int(sum(self.history[f'{id}_x']) / len(self.history[f'{id}_x']))
                smooth_cy = int(sum(self.history[f'{id}_y']) / len(self.history[f'{id}_y']))
                
                lm_list.append([id, smooth_cx, smooth_cy])
        return lm_list

    def calculate_angle(self, img, p1, p2, p3, lm_list, draw=True):
        if len(lm_list) > max(p1, p2, p3):
            # Get landmarks coordinates
            x1, y1 = lm_list[p1][1:]
            x2, y2 = lm_list[p2][1:]
            x3, y3 = lm_list[p3][1:]
            
            # Calculate absolute angle
            angle = np.degrees(np.arctan2(y3 - y2, x3 - x2) - np.arctan2(y1 - y2, x1 - x2))
            angle = np.abs(angle)
            if angle > 180.0:
                angle = 360 - angle
                
            if draw:
                cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), 2)
                cv2.line(img, (x3, y3), (x2, y2), (255, 255, 255), 2)
                cv2.circle(img, (x1, y1), 5, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x2, y2), 5, (0, 0, 255), cv2.FILLED)
                cv2.circle(img, (x3, y3), 5, (0, 0, 255), cv2.FILLED)
                cv2.putText(img, str(int(angle)), (x2 - 50, y2 + 50), 
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2)
            return angle
        return 0
