import mediapipe as mp
import cv2
import utils

class PoseDetector:
    def __init__(self, model_path='models/pose_landmarker.task'):
        utils.download_model(model_path)
        
        BaseOptions = mp.tasks.BaseOptions
        PoseLandmarker = mp.tasks.vision.PoseLandmarker
        PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode

        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=VisionRunningMode.VIDEO,
            min_pose_detection_confidence=0.3,
            min_pose_presence_confidence=0.3,
            min_tracking_confidence=0.3,
        )
        self.landmarker = PoseLandmarker.create_from_options(options)

    def process(self, frame, timestamp_ms):
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        return self.landmarker.detect_for_video(mp_image, timestamp_ms)

    def extract_landmarks(self, pose_result, w, h):
        if not pose_result.pose_landmarks:
            return None
        
        # We only care about the first detected person
        landmarks = pose_result.pose_landmarks[0]
        lm_dict = {}
        for idx, lm in enumerate(landmarks):
            lm_dict[idx] = (int(lm.x * w), int(lm.y * h), lm.visibility, lm.presence)
        return lm_dict
