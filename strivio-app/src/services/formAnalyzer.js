/**
 * Strivio Form Analyzer
 * Calculates real-time form accuracy with weighted metrics.
 * Confidence-gated: skips analysis when landmarks are unreliable.
 */
import { calculateAngle, findKeypoint } from './poseDetectionService';
import { detectPostureErrors } from './postureEngine';
import { smoothAngles } from './smoothingFilter';

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

  const anglesObj = { kneeAngle, hipAngle, backAngle, kneeAlignment };
  const errors = detectPostureErrors('squats', anglesObj);
  const feedback = errors.map(e => e.correction);

  return { accuracy: totalAccuracy, scores, feedback, errors, angles: anglesObj };
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

  const anglesObj = { elbowAngle, hipAngle, shoulderAngle, symmetry };
  const errors = detectPostureErrors('pushups', anglesObj);
  const feedback = errors.map(e => e.correction);

  return { accuracy: totalAccuracy, scores, feedback, errors, angles: anglesObj };
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

  const anglesObj = { frontKnee, backKnee, torsoUpright, balance };
  const errors = detectPostureErrors('lunges', anglesObj);
  const feedback = errors.map(e => e.correction);

  return { accuracy: totalAccuracy, scores: {}, feedback, errors, angles: anglesObj };
};

/**
 * Analyze form for jumping jacks
 */
const analyzeJumpingJacksForm = (keypoints) => {
  const find = (n) => findKeypoint(keypoints, n);
  const lShoulder = find('left_shoulder'), rShoulder = find('right_shoulder');
  const lElbow = find('left_elbow'), rElbow = find('right_elbow');
  const lHip = find('left_hip'), rHip = find('right_hip');

  if (!lShoulder || !rShoulder || !lHip || !rHip || !lElbow || !rElbow) return null;

  const shoulderAngle = calculateAngle(lElbow, lShoulder, lHip);
  const rShoulderAngle = calculateAngle(rElbow, rShoulder, rHip);
  
  // Symmetry
  const symmetry = Math.abs(shoulderAngle - rShoulderAngle);
  
  const scores = {
    shoulderAngle: scoreAngle(shoulderAngle, {min: 140, max: 180, weight: 0.6}),
    symmetry: scoreAngle(symmetry, {min: -15, max: 15, weight: 0.4})
  };

  const totalAccuracy = Math.round(scores.shoulderAngle * 0.6 + scores.symmetry * 0.4);

  return { accuracy: totalAccuracy, scores, feedback: ['Keep going!'], errors: [], angles: { shoulderAngle } };
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
      errors: [],
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
    case 'jumping_jacks':
      result = analyzeJumpingJacksForm(keypoints);
      break;
    case 'planks': {
      // Planks: score is just hold stability
      const plankErrors = detectPostureErrors('planks', { hipAngle: keypoints[11]?.y || 180 });
      result = { accuracy: 85, feedback: plankErrors.length ? plankErrors.map(e=>e.correction) : ['Hold steady'], errors: plankErrors, scores: {}, angles: {} };
      break;
    }
    default:
      return { accuracy: 0, feedback: ['Detecting exercise...'], errors: [], isPaused: false, scores: {} };
  }

  if (!result) {
    return { accuracy: 0, feedback: ['Position all joints in frame'], errors: [], isPaused: true, scores: {} };
  }

  lastRepAccuracy = result.accuracy;
  return { ...result, isPaused: false };
};

/**
 * Rep detection using a robust 4-state machine with debounce
 * States: IDLE → CONCENTRIC → ECCENTRIC → (rep counted) → IDLE
 */
const DEBOUNCE_MS = 600; // stricter debounce to prevent double counting jitter
const REP_THRESHOLDS = {
  squats:   { enter: 120, exit: 160, type: 'flexion' }, // knee flexes
  pushups:  { enter: 100, exit: 150, type: 'flexion' }, // elbow flexes
  lunges:   { enter: 110, exit: 150, type: 'flexion' }, // knee flexes
  jumping_jacks: { enter: 140, exit: 60, type: 'extension' }, // arms raise up
};

let repState = { phase: 'IDLE', reps: 0, lastRepTime: 0, repStartTime: 0 };

export const detectRep = (rawAngles, exercise) => {
  if (!rawAngles || exercise === 'planks') return repState;

  // Apply angle smoothing for stability
  const angles = smoothAngles(rawAngles);

  const thresholds = REP_THRESHOLDS[exercise];
  if (!thresholds) return repState;

  let primaryAngle = 180;
  if (exercise === 'pushups') primaryAngle = angles.elbowAngle || angles.leftElbow || 180;
  else if (exercise === 'jumping_jacks') primaryAngle = angles.shoulderAngle || angles.leftShoulder || 0;
  else primaryAngle = angles.kneeAngle || angles.frontKnee || angles.leftKnee || 180;

  const now = Date.now();
  const isFlexionBased = thresholds.type === 'flexion';

  // For squats/pushups: flexion means angle gets smaller.
  // For jumping jacks: extension means angle gets larger.

  switch (repState.phase) {
    case 'IDLE':
      if (isFlexionBased ? primaryAngle < thresholds.enter : primaryAngle > thresholds.enter) {
        repState.phase = 'MID_REP';
        repState.repStartTime = now;
      }
      break;

    case 'MID_REP':
      if (isFlexionBased ? primaryAngle > thresholds.exit : primaryAngle < thresholds.exit) {
        if ((now - repState.lastRepTime) > DEBOUNCE_MS && (now - repState.repStartTime) > 300) {
          repState.reps++;
          repState.lastRepTime = now;
          repAccuracies.push(lastRepAccuracy);
        }
        repState.phase = 'IDLE';
      }
      break;
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
  repState = { phase: 'IDLE', reps: 0, lastRepTime: 0, repStartTime: 0 };
  repAccuracies = [];
  lastRepAccuracy = 0;
  try {
    const { resetSmoothingBuffers } = require('./smoothingFilter');
    resetSmoothingBuffers();
  } catch(e) {}
};

/**
 * Compute a weighted overall form score (0-100)
 * Combines posture, ROM, symmetry, and tempo into one number
 * @param {number} postureScore - from analyzeForm accuracy (0-100)
 * @param {number} romScore - from tempoROMTracker (0-100, based on full range)
 * @param {number} symmetryScore - from tempoROMTracker (0-100)
 * @param {number} tempoScore - based on rep consistency (0-100)
 * @returns {number} weighted form score 0-100
 */
export const computeFormScore = (postureScore = 0, romScore = 100, symmetryScore = 100, tempoScore = 100) => {
  return Math.round(
    postureScore * 0.4 +
    romScore * 0.3 +
    symmetryScore * 0.2 +
    tempoScore * 0.1
  );
};
