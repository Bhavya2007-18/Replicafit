from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import threading
import time
from squat_api import SquatAnalyzer

app = Flask(__name__)
CORS(app)

analyzer = SquatAnalyzer()
camera = None
lock = threading.Lock()

def init_camera():
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
        # Optimize camera settings
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 30)

def generate_frames():
    global camera
    init_camera()
    
    # Frame skipping optimization
    frame_skip = 2
    frame_count = 0
    
    while True:
        with lock:
            if not camera.isOpened():
                time.sleep(0.1)
                continue
            success, frame = camera.read()
            if not success:
                time.sleep(0.1)
                continue
                
            frame_count += 1
            if frame_count % frame_skip != 0:
                continue
                
            # Process frame for squat detection
            processed_frame = analyzer.process_frame(frame)
            
            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_bytes = buffer.tobytes()
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    """Returns real-time progress of squat workout"""
    return jsonify({
        "status": "running",
        "squats_completed": analyzer.count,
        "feedback": analyzer.feedback
    })

if __name__ == '__main__':
    print("Starting AI Fitness Backend...")
    # Threaded parameter allows handling stream + API requests concurrently
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, use_reloader=False)
