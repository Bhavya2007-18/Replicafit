import json
import time
from flask import Flask, Response, jsonify
from flask_cors import CORS
from video_streamer import VideoStreamer

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
streamer = VideoStreamer()

@app.route('/video_feed')
def video_feed():
    return Response(streamer.get_frame(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/get_metrics')
def get_metrics():
    with streamer.lock:
        return jsonify({
            "reps":        streamer.reps,
            "left_reps":   streamer.left_reps,
            "right_reps":  streamer.right_reps,
            "state":       streamer.state,
            "score":       streamer.score,
            "tempo":       streamer.tempo,
            "curl_progress": streamer.curl_progress,
            "fps":         streamer.fps,
            "feedback":    streamer.feedback,
            "rep_quality": streamer.rep_quality,
            "l_angle":     streamer.l_angle,
            "r_angle":     streamer.r_angle,
        })

def _event_generator():
    """Server-Sent Events: push metrics the moment they change."""
    last_reps = -1
    while True:
        time.sleep(0.05)   # 20 Hz push rate
        with streamer.lock:
            payload = {
                "reps":        streamer.reps,
                "left_reps":   streamer.left_reps,
                "right_reps":  streamer.right_reps,
                "state":       streamer.state,
                "score":       streamer.score,
                "tempo":       round(streamer.tempo, 2),
                "curl_progress": streamer.curl_progress,
                "fps":         streamer.fps,
                "feedback":    streamer.feedback,
                "rep_quality": streamer.rep_quality,
                "l_angle":     round(streamer.l_angle, 1),
                "r_angle":     round(streamer.r_angle, 1),
            }
        yield f"data: {json.dumps(payload)}\n\n"

@app.route('/metrics_stream')
def metrics_stream():
    return Response(
        _event_generator(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*',
        }
    )

if __name__ == '__main__':
    print("Starting Output Stream on port 5001...")
    app.run(host='0.0.0.0', port=5001, threaded=True)

