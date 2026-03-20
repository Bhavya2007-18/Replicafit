import os
import cv2
import numpy as np
import base64
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_squat_coach import PoseDetector, SquatAnalyzer

# 1. SETUP LOGGING
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("FitnessAPI")

app = Flask(__name__)
CORS(app)

# 2. INITIALIZE ENGINES
# Note: In a production multi-user system, you would use a session manager.
# For this deployment, we use a single instance for the demo user.
detector = PoseDetector()
analyzer = SquatAnalyzer()

@app.route('/process_frame', methods=['POST'])
def process_frame():
    """
    Receives a base64 encoded frame from the frontend, 
    processes it using MediaPipe, and returns metrics + landmarks.
    """
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400

        # Decode base64 image
        img_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400

        h, w, _ = img.shape
        
        # 1. POSE DETECTION
        results = detector.process_frame(img)
        lm_dict = detector.extract_landmarks(results, w, h)
        
        # 2. SQUAT ANALYSIS
        # This updates the stateful 'analyzer' object
        analysis_data = analyzer.update(lm_dict)
        
        # 3. PREPARE RESPONSE DATA
        # We send back landmarks instead of the whole image to save bandwidth.
        # The frontend will render the skeleton.
        landmarks = []
        if results.pose_landmarks:
            for lm in results.pose_landmarks.landmark:
                landmarks.append({
                    "x": lm.x,
                    "y": lm.y,
                    "z": lm.z,
                    "visibility": lm.visibility
                })

        response = {
            "reps": analyzer.reps,
            "state": analyzer.state,
            "feedback": list(analyzer.feedback_msgs),
            "tempo": analyzer.tempo,
            "depth": analysis_data.get("depth_score", 0) if analysis_data else 0,
            "landmarks": landmarks,
            "score": int(np.mean(analyzer.rep_scores)) if analyzer.rep_scores else 0
        }
        
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return jsonify({"error": "Internal server error during processing"}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "engine": "MediaPipe Pose"}), 200

if __name__ == '__main__':
    # Cloud providers like Railway/Heroku assign a port via the PORT env variable
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"🚀 Starting Production API on 0.0.0.0:{port}")
    
    # Debug=False for production deployment
    app.run(host='0.0.0.0', port=port, debug=False)
