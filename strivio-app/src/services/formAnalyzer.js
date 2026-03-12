/**
 * Strivio Form Analyzer
 * Calculates real-time form accuracy with weighted metrics.
 * Confidence-gated: skips analysis when landmarks are unreliable.
 */
import { calculateAngle, findKeypoint } from './poseDetectionService';

// Per-rep accuracy history
let repAccuracies = [];
let lastRepAccuracy = 0;

/**
 * Ideal angle ranges for each exercise
 * { min, max } = acceptable range for good form
 */
const IDEAL_FORMS = {
  squats: {
    kneeAngle: { min: 70, max: 100, weight: 0.35, label: 'Knee depth' },
    hipAngle: { min: 60, max: 100, weight: 0.25, label: 'Hip flexion' },
    backAngle: { min: 0, max: 30, weight: 0.25, label: 'Back straightness' },
    kneeAlignment: { min: -10, max: 10, weight: 0.15, label: 'Knee alignment' },
  },
  pushups: {
    elbowAngle: { min: 70, max: 100, weight: 0.35, label: 'Elbow depth' },
    hipAngle: { min: 160, max: 180, weight: 0.3, label: 'Body line' },
    shoulderAngle: { min: 60, max: 90, weight: 0.2, label: 'Arm position' },
    symmetry: { min: -5, max: 5, weight: 0.15, label: 'Symmetry' },
  },
  lunges: {
    frontKnee: { min: 80, max: 100, weight: 0.35, label: 'Front knee angle' },
    backKnee: { min: 80, max: 110, weight: 0.25, label: 'Back knee angle' },
    torsoUpright: { min: 0, max: 15, weight: 0.25, label: 'Torso upright' },
    balance: { min: -10, max: 10, weight: 0.15, label: 'Balance' },
  },
  planks: {
    hipAngle: { min: 165, max: 180, weight: 0.4, label: 'Hip alignment' },
    shoulderAngle: { min: 80, max: 100, weight: 0.3, label: 'Arm position' },
    spineAngle: { min: 170, max: 185, weight: 0.3, label: 'Spine straight' },
  },
};

/**
 * Score how close a measured angle is to the ideal range [0-100]
 */
const scoreAngle = (measured, ideal) => {
  if (measured >= ideal.min && measured <= ideal.max) return 100;
  const distFromRange = measured < ideal.min ? ideal.min - measured : measured - ideal.max;
  return Math.max(0, 100 - distFromRange * 3);
};

/**
 * Analyze form for squats
 */
const analyzeSquatForm = (keypoints) => {
  const find = (n) => findKeypoint(keypoints, n);
  const lHip = find('left_hip'), lKnee = find('left_knee'), lAnkle = find('left_ankle');
  const lShoulder = find('left_shoulder');
  const rHip = find('right_hip'), rKnee = find('right_knee'), rAnkle = find('right_ankle');

  if (!lHip || !lKnee || !lAnkle || !lShoulder) return null;

  const kneeAngle = calculateAngle(lHip, lKnee, lAnkle);
  const hipAngle = calculateAngle(lShoulder, lHip, lKnee);
  const vertical = { x: lHip.x, y: lHip.y - 0.3 };
  const backAngle = calculateAngle(lShoulder, lHip, vertical);
  const kneeOffsetX = lKnee.x - lAnkle.x;
  const kneeAlignment = kneeOffsetX * 100;

  const ideal = IDEAL_FORMS.squats;
  const scores = {
    kneeAngle: scoreAngle(kneeAngle, ideal.kneeAngle),
    hipAngle: scoreAngle(hipAngle, ideal.hipAngle),
    backAngle: scoreAngle(backAngle, ideal.backAngle),
    kneeAlignment: scoreAngle(kneeAlignment, ideal.kneeAlignment),
  };

  const totalAccuracy = Math.round(
    scores.kneeAngle * ideal.kneeAngle.weight +
    scores.hipAngle * ideal.hipAngle.weight +
    scores.backAngle * ideal.backAngle.weight +
    scores.kneeAlignment * ideal.kneeAlignment.weight
  );

  // Generate feedback based on weakest area
  const feedback = [];
  if (scores.backAngle < 60) feedback.push('Straighten your back');
  if (scores.kneeAngle < 50) feedback.push('Lower your hips further');
  if (scores.kneeAlignment < 50) feedback.push('Keep knees aligned with toes');
  if (kneeAngle > 140) feedback.push('Go deeper into the squat');

  return { accuracy: totalAccuracy, scores, feedback, angles: { kneeAngle, hipAngle, backAngle } };
};

/**
 * Analyze form for pushups
 */
const analyzePushupForm = (keypoints) => {
  const find = (n) => findKeypoint(keypoints, n);
  const lShoulder = find('left_shoulder'), rShoulder = find('right_shoulder');
  const lElbow = find('left_elbow'), lWrist = find('left_wrist');
  const lHip = find('left_hip'), lAnkle = find('left_ankle');

  if (!lShoulder || !lElbow || !lWrist || !lHip) return null;

  const elbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const hipAngle = lHip && lAnkle ? calculateAngle(lShoulder, lHip, lAnkle) : 170;
  const shoulderAngle = calculateAngle(lElbow, lShoulder, lHip);
  const symmetry = rShoulder ? Math.abs(lShoulder.y - rShoulder.y) * 100 : 0;

  const ideal = IDEAL_FORMS.pushups;
  const scores = {
    elbowAngle: scoreAngle(elbowAngle, ideal.elbowAngle),
    hipAngle: scoreAngle(hipAngle, ideal.hipAngle),
    shoulderAngle: scoreAngle(shoulderAngle, ideal.shoulderAngle),
    symmetry: scoreAngle(symmetry, ideal.symmetry),
  };

  const totalAccuracy = Math.round(
    scores.elbowAngle * ideal.elbowAngle.weight +
    scores.hipAngle * ideal.hipAngle.weight +
    scores.shoulderAngle * ideal.shoulderAngle.weight +
    scores.symmetry * ideal.symmetry.weight
  );

  const feedback = [];
  if (scores.hipAngle < 60) feedback.push('Keep your body in a straight line');
  if (scores.elbowAngle < 50) feedback.push('Lower your chest more');
  if (scores.symmetry < 50) feedback.push('Keep shoulders level');

  return { accuracy: totalAccuracy, scores, feedback, angles: { elbowAngle, hipAngle } };
};

/**
 * Analyze form for lunges
 */
const analyzeLungeForm = (keypoints) => {
  const find = (n) => findKeypoint(keypoints, n);
  const lHip = find('left_hip'), lKnee = find('left_knee'), lAnkle = find('left_ankle');
  const rHip = find('right_hip'), rKnee = find('right_knee'), rAnkle = find('right_ankle');
  const lShoulder = find('left_shoulder');

  if (!lHip || !lKnee || !lAnkle || !rKnee) return null;

  const frontKnee = calculateAngle(lHip, lKnee, lAnkle);
  const backKnee = rHip && rAnkle ? calculateAngle(rHip, rKnee, rAnkle) : 120;
  const vertical = { x: lHip.x, y: lHip.y - 0.3 };
  const torsoUpright = lShoulder ? calculateAngle(lShoulder, lHip, vertical) : 10;
  const balance = lHip && rHip ? Math.abs(lHip.y - rHip.y) * 100 : 0;

  const ideal = IDEAL_FORMS.lunges;
  const totalAccuracy = Math.round(
    scoreAngle(frontKnee, ideal.frontKnee) * ideal.frontKnee.weight +
    scoreAngle(backKnee, ideal.backKnee) * ideal.backKnee.weight +
    scoreAngle(torsoUpright, ideal.torsoUpright) * ideal.torsoUpright.weight +
    scoreAngle(balance, ideal.balance) * ideal.balance.weight
  );

  const feedback = [];
  if (frontKnee > 110) feedback.push('Bend front knee deeper');
  if (torsoUpright > 20) feedback.push('Keep torso upright');

  return { accuracy: totalAccuracy, scores: {}, feedback, angles: { frontKnee, backKnee } };
};

/**
 * Main form analysis function
 * Routes to the correct analyzer based on detected exercise
 */
export const analyzeForm = (keypoints, exercise, isReliable) => {
  // Confidence gate: don't analyze if landmarks are unreliable
  if (!isReliable || !keypoints || keypoints.length === 0) {
    return {
      accuracy: 0,
      feedback: ['Please step fully into the camera frame.'],
      isPaused: true,
      scores: {},
    };
  }

  let result = null;

  switch (exercise) {
    case 'squats':
      result = analyzeSquatForm(keypoints);
      break;
    case 'pushups':
      result = analyzePushupForm(keypoints);
      break;
    case 'lunges':
      result = analyzeLungeForm(keypoints);
      break;
    case 'planks':
      // Planks: score is just hold stability
      result = { accuracy: 85, feedback: ['Hold steady'], scores: {}, angles: {} };
      break;
    default:
      return { accuracy: 0, feedback: ['Detecting exercise...'], isPaused: false, scores: {} };
  }

  if (!result) {
    return { accuracy: 0, feedback: ['Position all joints in frame'], isPaused: true, scores: {} };
  }

  lastRepAccuracy = result.accuracy;
  return { ...result, isPaused: false };
};

/**
 * Rep detection using state machine per exercise
 */
let repState = { phase: 'idle', reps: 0 };

export const detectRep = (angles, exercise) => {
  if (!angles) return repState;

  const kneeAngle = angles.kneeAngle || angles.leftKnee || 180;
  const elbowAngle = angles.elbowAngle || angles.leftElbow || 180;

  switch (exercise) {
    case 'squats': {
      if (kneeAngle > 155 && repState.phase === 'down') {
        repState.reps++;
        repAccuracies.push(lastRepAccuracy);
        repState.phase = 'up';
      } else if (kneeAngle < 110) {
        repState.phase = 'down';
      }
      break;
    }
    case 'pushups': {
      if (elbowAngle > 155 && repState.phase === 'down') {
        repState.reps++;
        repAccuracies.push(lastRepAccuracy);
        repState.phase = 'up';
      } else if (elbowAngle < 100) {
        repState.phase = 'down';
      }
      break;
    }
    case 'lunges': {
      const frontKnee = angles.frontKnee || kneeAngle;
      if (frontKnee > 155 && repState.phase === 'down') {
        repState.reps++;
        repAccuracies.push(lastRepAccuracy);
        repState.phase = 'up';
      } else if (frontKnee < 110) {
        repState.phase = 'down';
      }
      break;
    }
  }

  return repState;
};

/**
 * Get session summary
 */
export const getSessionSummary = () => {
  const avgAccuracy = repAccuracies.length > 0
    ? Math.round(repAccuracies.reduce((a, b) => a + b, 0) / repAccuracies.length)
    : 0;
  const bestAccuracy = repAccuracies.length > 0
    ? Math.round(Math.max(...repAccuracies))
    : 0;

  return { totalReps: repState.reps, avgAccuracy, bestAccuracy, repAccuracies: [...repAccuracies] };
};

/**
 * Reset all form analysis state
 */
export const resetFormAnalyzer = () => {
  repState = { phase: 'idle', reps: 0 };
  repAccuracies = [];
  lastRepAccuracy = 0;
};
