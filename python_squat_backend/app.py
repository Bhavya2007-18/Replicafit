from flask import Flask, Response, jsonify
from flask_cors import CORS
from video_streamer import VideoStreamer

app = Flask(__name__)
CORS(app)
streamer = VideoStreamer()

@app.route('/video_feed')
def video_feed():
    return Response(streamer.get_frame(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_reps')
def get_reps():
    with streamer.lock:
        return jsonify({"reps": streamer.reps})

@app.route('/get_feedback')
def get_feedback():
    with streamer.lock:
        return jsonify({"feedback": streamer.feedback})

@app.route('/get_metrics')
def get_metrics():
    with streamer.lock:
        return jsonify({
            "reps": streamer.reps,
            "state": streamer.state,
            "score": streamer.score,
            "tempo": streamer.tempo,
            "curl_progress": streamer.curl_progress,
            "fps": streamer.fps,
            "feedback": streamer.feedback
        })

if __name__ == '__main__':
    print("Starting Output Stream on port 5000...")
    app.run(host='0.0.0.0', port=5000, threaded=True)
