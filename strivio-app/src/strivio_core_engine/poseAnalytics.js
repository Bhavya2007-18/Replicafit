/**
 * Strivio Core Engine - Pose Analytics
 * Extracted and adapted from Kaladristhi index.html implementation.
 * Note: These are base functions that will need to be heavily modified to track dynamic fitness reps (like Squats) instead of static dance poses.
 */

export const poseAnalytics = {
    
    // Example from Kaladristhi: static posture score based on horizontal alignment
    analyzeStaticPosture: (landmarks) => {
        if(!landmarks) return 0;
        
        const nose = landmarks[0];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const centerHip = (leftHip.x + rightHip.x)/2;
        
        // Example: Penalize if nose is not vertically aligned with center of hips
        const spineScore = Math.max(0, 100 - (Math.abs(nose.x - centerHip) * 600));
        
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const shoulderScore = Math.max(0, 100 - (Math.abs(leftShoulder.y - rightShoulder.y) * 400));
        
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const armSpread = Math.abs(leftElbow.x - rightElbow.x);
        const armScore = armSpread > 0.3 ? 100 : 50;

        const finalScore = Math.floor((spineScore * 0.4) + (shoulderScore * 0.4) + (armScore * 0.2));
        
        return {
            score: finalScore,
            isExcellent: finalScore > 75
        };
    },

    // Example of tracking a multi-step sequence (from Kaladristhi's Bhumi Pranam)
    // This serves as the foundation for how we will build dynamic Rep counters (e.g. Squat: state 1 standing, state 2 down, state 3 standing again -> 1 rep)
    detectSequenceExample: (results, stateData) => {
        if (!results.poseLandmarks) {
            return { done: false, step: "Pose not visible", stateData };
        }

        const pose = results.poseLandmarks;
        const leftShoulder = pose[11];
        const rightShoulder = pose[12];
        const leftHip = pose[23];
        const rightHip = pose[24];
        const nose = pose[0];

        // Basic check for torso bend
        const chestY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipCenterY = (leftHip.y + rightHip.y) / 2;
        const torsoBent = nose.y > chestY + 0.05 && nose.y < hipCenterY;

        // Note: For Strivio, we will add utility math functions here:
        // calculateAngle(jointA, jointB, jointC) to measure exact angles (e.g., knee depth).
        
        return {
            isBent: torsoBent
        };
    },

    // Helper Math function we will need for Strivio
    calculateAngle: (a, b, c) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle;
    }
};
