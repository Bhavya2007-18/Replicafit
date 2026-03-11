/**
 * Strivio AI Engine - Powered by TensorFlow MoveNet
 */

// Helper to calculate angle between three points
// e.g. Hip, Knee, Ankle
export const calculateAngle = (pointA, pointB, pointC) => {
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) - 
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) {
      angle = 360 - angle;
  }
  return angle;
};

// Squat Analysis Machine
// Receives an array of keypoints from MoveNet: { y, x, score, name }
export const analyzeSquat = (keypoints, currentState) => {
  // Find needed joints
  const findJoint = (name) => keypoints.find(k => k.name === name);
  
  const leftHip = findJoint('left_hip');
  const leftKnee = findJoint('left_knee');
  const leftAnkle = findJoint('left_ankle');
  const leftShoulder = findJoint('left_shoulder');

  if (!leftHip || !leftKnee || !leftAnkle || leftHip.score < 0.3) {
    return { ...currentState, feedback: "Ensure full body is visible" };
  }

  // Calculate knee angle
  const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  
  // Calculate back angle (Shoulder - Hip - vertical line)
  const verticalPoint = { x: leftHip.x, y: leftHip.y - 100 };
  const backAngle = calculateAngle(leftShoulder, leftHip, verticalPoint);

  let feedback = "Good form";
  let accuracyScore = 100;

  if (backAngle > 45) {
    feedback = "Keep your back straighter";
    accuracyScore -= 20;
  }

  let newState = { ...currentState, feedback, accuracyScore };

  // Repetition tracking logic
  // "up" = standing (angle > 160)
  // "down" = squatting (angle < 90)
  
  if (kneeAngle > 160) {
    if (currentState.poseState === 'down') {
      // Completed a rep
      newState.reps = currentState.reps + 1;
    }
    newState.poseState = 'up';
  } else if (kneeAngle < 100) {
    newState.poseState = 'down';
    if (kneeAngle > 90) {
      newState.feedback = "Lower hips slightly deeper";
      accuracyScore -= 10;
    }
  }

  newState.accuracyScore = Math.max(0, accuracyScore);
  
  return newState;
};
