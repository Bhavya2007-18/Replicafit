// ==========================================
// CLOUD-READY FRONTEND BICEP CURL INTEGRATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. UI HOOKS
    const videoElement = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    const ctx = canvasElement.getContext('2d');
    
    // UI Elements from HTML
    const displayImg = document.getElementById('curl-video-feed');
    const repCountUI = document.getElementById('rep-count');
    const stateUI = document.getElementById('curl-state');
    const feedbackUI = document.getElementById('feedback-text');
    const scoreUI = document.getElementById('quality-score');
    const curlBarUI = document.getElementById('curl-progress');
    const leftRepsUI = document.getElementById('left-reps');
    const rightRepsUI = document.getElementById('right-reps');

    // 2. CONFIGURATION
    const API_DOMAIN = window.location.hostname === 'localhost' ? 'http://127.0.0.1:5000' : '';
    const PROCESS_URL = `${API_DOMAIN}/process_frame`;
    const CAPTURE_INTERVAL = 150; // ~6.6 FPS for processing

    // 3. INITIALIZE WEBCAM
    async function startWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 }, 
                audio: false 
            });
            videoElement.srcObject = stream;
            videoElement.play();
            console.log("✅ Webcam active");
            
            setInterval(captureAndSendFrame, CAPTURE_INTERVAL);
        } catch (err) {
            console.error("❌ Media error:", err);
            if (feedbackUI) feedbackUI.innerText = "Camera access denied.";
        }
    }

    // 4. CAPTURE & SEND FRAME
    async function captureAndSendFrame() {
        if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) return;

        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        const imageData = canvasElement.toDataURL('image/jpeg', 0.5);

        try {
            const response = await fetch(PROCESS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });

            if (!response.ok) throw new Error("Backend offline");

            const data = await response.json();
            updateUI(data);
        } catch (err) {
            console.error("❌ API Error:", err);
            if (feedbackUI) feedbackUI.innerText = "Connecting to AI server...";
        }
    }

    // 5. UPDATE UI METRICS
    function updateUI(data) {
        if (data.error) {
            if (feedbackUI) feedbackUI.innerText = data.error;
            return;
        }

        if (repCountUI) repCountUI.innerText = data.reps;
        if (stateUI) stateUI.innerText = data.state;
        if (scoreUI) scoreUI.innerText = data.score;
        if (leftRepsUI) leftRepsUI.innerText = `L: ${data.left_reps || 0}`;
        if (rightRepsUI) rightRepsUI.innerText = `R: ${data.right_reps || 0}`;
        
        if (feedbackUI) {
            const text = data.feedback.length > 0 ? data.feedback.join(" | ") : "Form looks good";
            feedbackUI.innerText = text;
            feedbackUI.style.color = data.feedback.length > 0 ? "orange" : "lime";
        }

        if (curlBarUI) {
            const progress = data.curl_progress || 0;
            curlBarUI.style.height = `${progress}%`;
            curlBarUI.style.backgroundColor = progress >= 85 ? "lime" : "orange";
        }
    }

    // Launch
    startWebcam();
});
