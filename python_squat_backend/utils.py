import numpy as np
import collections
import urllib.request
import os

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

class Smoother:
    def __init__(self, window=5):
        self.window = window
        self.history = collections.defaultdict(lambda: collections.deque(maxlen=window))

    def smooth(self, key, val):
        self.history[key].append(val)
        return sum(self.history[key]) / len(self.history[key])

def download_model(model_path):
    if not os.path.exists(model_path):
        print(f"Downloading model to {model_path}...")
        url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        urllib.request.urlretrieve(url, model_path)
        print("Download complete.")
