/**
 * Strivio Core Engine - Pose Detection & Initializer
 * Extracted from Kaladristhi index.html implementation
 */

export const poseDetection = {
    state: {
        holistic: null,
        loopId: null,
        mode: 'camera',
        showLandmarks: true,
        recording: false
    },

    initHolistic: (onResultsCallback) => {
        // Requires mediapipe/holistic to be imported in the HTML via CDN
        const holistic = new Holistic({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`});
        holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false, 
            smoothSegmentation: false,
            refineFaceLandmarks: true, // we might not need this for general fitness, but keeping for now
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        holistic.onResults(onResultsCallback);
        poseDetection.state.holistic = holistic;
        return holistic;
    },

    startCamera: async (videoElement, onResultsCallback) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720, facingMode: "user" } 
            });
            videoElement.srcObject = stream;
            await videoElement.play();
            
            if(!poseDetection.state.holistic) {
                poseDetection.initHolistic(onResultsCallback);
            }
            
            poseDetection.state.mode = 'camera';

            const sendFrame = async () => {
                if(poseDetection.state.mode === 'camera' && !videoElement.paused && !videoElement.ended) {
                    await poseDetection.state.holistic.send({image: videoElement});
                    poseDetection.state.loopId = requestAnimationFrame(sendFrame);
                }
            };
            sendFrame();
            return true;
        } catch (e) {
            console.error("Camera start failed:", e);
            return false;
        }
    },

    stopCamera: (videoElement) => {
        if(poseDetection.state.loopId) {
            cancelAnimationFrame(poseDetection.state.loopId);
        }
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(t => t.stop());
            videoElement.srcObject = null;
        }
    }
};
