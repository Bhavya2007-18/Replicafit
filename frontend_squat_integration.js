// ==========================================
// FRONTEND SQUAT INTEGRATION SCRIPT
// ==========================================
/**
 * Instructions:
 * Attach this script to your pre-built UI.
 * Make sure your HTML has these ID hooks:
 * - <img id="squat-video-feed">
 * - <span id="rep-count">
 * - <span id="squat-state">
 * - <span id="feedback-text">
 * - <span id="quality-score">
 * - <div id="depth-progress" style="height: 0%"></div>
 */

document.addEventListener("DOMContentLoaded", () => {
    const videoElement = document.getElementById('squat-video-feed');
    const repCountUI = document.getElementById('rep-count');
    const stateUI = document.getElementById('squat-state');
    const feedbackUI = document.getElementById('feedback-text');
    const scoreUI = document.getElementById('quality-score');
    const depthBarUI = document.getElementById('depth-progress');

    // 1. ATTACH MOTION-JPEG STREAM
    // By simply assigning the image SRC to our backend stream URL, 
    // the browser naturally receives the HTTP multipart stream. No manual canvas drawing needed.
    const VIDEO_URL = 'http://127.0.0.1:5000/video_feed';
    videoElement.src = VIDEO_URL;
    
    videoElement.onerror = () => {
        feedbackUI.innerText = "Camera disconnected or API offline.";
        feedbackUI.style.color = "red";
    };

    // 2. ATTACH DATA TELEMETRY POLLING
    // Polling interval is 150ms. It's rapid enough for physical movements but gentle on the server thread lock.
    const METRICS_URL = 'http://127.0.0.1:5000/metrics';

    async function fetchLiveMetrics() {
        try {
            const res = await fetch(METRICS_URL);
            if (!res.ok) throw new Error("API Outage");
            
            const data = await res.json();
            
            // Handle Detection Errors ("No User" / "Camera Off")
            if (data.error) {
                if (feedbackUI.innerText !== data.error) {
                    feedbackUI.innerText = data.error;
                    feedbackUI.style.color = "orange";
                }
                return;
            }

            // AVOID FLICKERING: Only manipulate DOM if the text changed!
            if (repCountUI && repCountUI.innerText !== String(data.reps)) {
                repCountUI.innerText = data.reps;
                // Add a cool CSS pop animation class when reps go up!
            }

            if (stateUI && stateUI.innerText !== data.state) {
                stateUI.innerText = data.state;
            }

            if (scoreUI && scoreUI.innerText !== String(data.score)) {
                scoreUI.innerText = data.score;
            }
            
            // Format dynamic feedback
            if (feedbackUI) {
                const feedbackText = data.feedback.length > 0 ? data.feedback.join(" | ") : "Form looks good";
                if (feedbackUI.innerText !== feedbackText) {
                    feedbackUI.innerText = feedbackText;
                    feedbackUI.style.color = data.feedback.length > 0 ? "#FF3333" : "#33FF33";
                }
            }
            
            // Smoothly animate the depth bar using CSS transitions `transition: height 0.15s ease-out;`
            if (depthBarUI) {
                depthBarUI.style.height = `${data.depth}%`;
                depthBarUI.style.backgroundColor = data.depth >= 85 ? "lime" : "orange";
            }

        } catch (error) {
            if (feedbackUI) {
                feedbackUI.innerText = "Connection lost... Retrying";
                feedbackUI.style.color = "red";
            }
        }
    }

    // Launch background worker at ~6 FPS lockstep 
    setInterval(fetchLiveMetrics, 150);
});
