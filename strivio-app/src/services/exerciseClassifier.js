/**
 * Strivio Exercise Classifier
 * Automatically detects which exercise the user is performing
 * based on body landmark positions and joint angle patterns.
 */
import { calculateAngle, findKeypoint } from './poseDetectionService';

// Extended exercise schema with tutorial support
const exerciseSchema = {
  id: String,
  name: String,
  description: String,
  targetMuscles: [String],
  difficulty: String,
  tutorialUrl: String,
  videoPreviewUrl: String
};

// Sliding window of recent frames for pattern detection
const FRAME_WINDOW = 15;
let frameHistory = [];
let detectedExercise = null;
let exerciseConfidence = 0;

/**
 * Body orientation: 'upright', 'horizontal', 'bent'
 */
const getBodyOrientation = (keypoints) => {
  const lShoulder = findKeypoint(keypoints, 'left_shoulder');
  const lHip = findKeypoint(keypoints, 'left_hip');
  const lAnkle = findKeypoint(keypoints, 'left_ankle');

  if (!lShoulder || !lHip || !lAnkle) return 'unknown';

  const torsoAngle = Math.abs(lShoulder.y - lHip.y);
  const legAngle = Math.abs(lHip.y - lAnkle.y);

  // Horizontal body = pushup/plank position
  if (torsoAngle < 0.08 && Math.abs(lShoulder.x - lHip.x) > 0.15) return 'horizontal';
  // Upright = standing exercises
  if (lShoulder.y < lHip.y && lHip.y < lAnkle.y) return 'upright';
  // Bent = bent-over position
  return 'bent';
};

/**
 * Extract key joint angles from a frame
 */
const extractAngles = (keypoints) => {
  const find = (name) => findKeypoint(keypoints, name);

  const lShoulder = find('left_shoulder');
  const rShoulder = find('right_shoulder');
  const lElbow = find('left_elbow');
  const rElbow = find('right_elbow');
  const lWrist = find('left_wrist');
  const rWrist = find('right_wrist');
  const lHip = find('left_hip');
  const rHip = find('right_hip');
  const lKnee = find('left_knee');
  const rKnee = find('right_knee');
  const lAnkle = find('left_ankle');
  const rAnkle = find('right_ankle');

  const angles = {};

  // Knee angles (critical for squats, lunges)
  if (lHip && lKnee && lAnkle) angles.leftKnee = calculateAngle(lHip, lKnee, lAnkle);
  if (rHip && rKnee && rAnkle) angles.rightKnee = calculateAngle(rHip, rKnee, rAnkle);

  // Elbow angles (critical for pushups, arm raises)
  if (lShoulder && lElbow && lWrist) angles.leftElbow = calculateAngle(lShoulder, lElbow, lWrist);
  if (rShoulder && rElbow && rWrist) angles.rightElbow = calculateAngle(rShoulder, rElbow, rWrist);

  // Hip angles (critical for squats, planks)
  if (lShoulder && lHip && lKnee) angles.leftHip = calculateAngle(lShoulder, lHip, lKnee);
  if (rShoulder && rHip && rKnee) angles.rightHip = calculateAngle(rShoulder, rHip, rKnee);

  // Shoulder angles (for arm raises, jumping jacks)
  if (lElbow && lShoulder && lHip) angles.leftShoulder = calculateAngle(lElbow, lShoulder, lHip);
  if (rElbow && rShoulder && rHip) angles.rightShoulder = calculateAngle(rElbow, rShoulder, rHip);

  return angles;
};

/**
 * Pattern matching rules for each exercise
 */
const EXERCISE_PATTERNS = {
  squats: {
    detect: (angles, orientation) => {
      if (orientation !== 'upright') return 0;
      const kneeAngle = angles.leftKnee || angles.rightKnee || 180;
      const hipAngle = angles.leftHip || angles.rightHip || 180;
      // Squat pattern: knee bends below 130°, hip flexes
      if (kneeAngle < 140 && hipAngle < 140) return 0.9;
      if (kneeAngle < 160 && hipAngle < 160) return 0.5;
      return 0.1;
    },
  },

  pushups: {
    detect: (angles, orientation) => {
      if (orientation !== 'horizontal') return 0;
      const elbowAngle = angles.leftElbow || angles.rightElbow || 180;
      // Pushup: body horizontal + elbow bending
      if (elbowAngle < 120) return 0.9;
      if (elbowAngle < 160) return 0.6;
      return 0.3;
    },
  },

  lunges: {
    detect: (angles, orientation) => {
      if (orientation !== 'upright') return 0;
      const lKnee = angles.leftKnee || 180;
      const rKnee = angles.rightKnee || 180;
      // Lunge: one knee bent deep, other extended or bent at different angle
      const diff = Math.abs(lKnee - rKnee);
      if (diff > 30 && Math.min(lKnee, rKnee) < 120) return 0.85;
      if (diff > 20) return 0.4;
      return 0;
    },
  },

  planks: {
    detect: (angles, orientation) => {
      if (orientation !== 'horizontal') return 0;
      const elbowAngle = angles.leftElbow || angles.rightElbow || 180;
      const hipAngle = angles.leftHip || angles.rightHip || 180;
      // Plank: body horizontal, arms straight or on forearms, hips straight
      if (elbowAngle > 150 && hipAngle > 150) return 0.8;
      if (hipAngle > 140) return 0.5;
      return 0.2;
    },
  },

  jumping_jacks: {
    detect: (angles, orientation) => {
      if (orientation !== 'upright') return 0;
      const lShoulder = angles.leftShoulder || 0;
      const rShoulder = angles.rightShoulder || 0;
      // Jumping jacks: arms raised above shoulders
      if (lShoulder > 120 && rShoulder > 120) return 0.8;
      if (lShoulder > 90 && rShoulder > 90) return 0.5;
      return 0;
    },
  },
};

/**
 * Classify exercise from current keypoints
 * Uses sliding window for stability
 */
export const classifyExercise = (keypoints) => {
  const orientation = getBodyOrientation(keypoints);
  const angles = extractAngles(keypoints);

  // Store frame data in sliding window
  frameHistory.push({ angles, orientation, timestamp: Date.now() });
  if (frameHistory.length > FRAME_WINDOW) frameHistory.shift();

  // Need at least 5 frames for stable detection
  if (frameHistory.length < 5) {
    return { exercise: detectedExercise, confidence: exerciseConfidence, angles };
  }

  // Score each exercise pattern across recent frames
  const scores = {};
  for (const [name, pattern] of Object.entries(EXERCISE_PATTERNS)) {
    const recentScores = frameHistory.map(f => pattern.detect(f.angles, f.orientation));
    scores[name] = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  }

  // Pick the highest scoring exercise
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  
  // Implement hysteresis/stickiness to prevent rapid flickering
  const CONFIDENCE_THRESHOLD = 0.4;
  
  if (best && best[1] > CONFIDENCE_THRESHOLD) {
    detectedExercise = best[0];
    exerciseConfidence = best[1];
  } else if (exerciseConfidence > 0) {
    // Decay confidence slowly instead of instantly dropping
    exerciseConfidence -= 0.05;
    if (exerciseConfidence <= 0) {
      detectedExercise = null;
    }
  }

  return { exercise: detectedExercise, confidence: exerciseConfidence, angles };
};

/**
 * Reset classifier state
 */
export const resetClassifier = () => {
  frameHistory = [];
  detectedExercise = null;
  exerciseConfidence = 0;
};

/**
 * Get display name for an exercise
 */
export const getExerciseDisplayName = (exercise) => {
  const names = {
    squats: 'Squats',
    pushups: 'Pushups',
    lunges: 'Lunges',
    planks: 'Plank',
    jumping_jacks: 'Jumping Jacks',
  };
  return names[exercise] || 'Detecting...';
};
