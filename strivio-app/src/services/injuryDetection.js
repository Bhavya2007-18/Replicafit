/**
 * Strivio Injury Risk Detection
 * Analyzes movement patterns during exercises to detect potential injury risks.
 * Returns warnings and corrective suggestions.
 */
import { calculateAngle, findKeypoint } from './poseDetectionService';

// Risk thresholds
const RISK_THRESHOLDS = {
  kneeCollapse: 15, // degrees of inward knee deviation
  backCurvature: 45, // degrees of excessive forward lean
  asymmetry: 20, // percentage difference between left/right
  neckStrain: 30, // degrees of forward neck position
};

/**
 * Detect knee collapse (valgus) during squats/lunges
 */
const detectKneeCollapse = (keypoints) => {
  const lKnee = findKeypoint(keypoints, 'left_knee');
  const lAnkle = findKeypoint(keypoints, 'left_ankle');
  const lHip = findKeypoint(keypoints, 'left_hip');

  if (!lKnee || !lAnkle || !lHip) return null;

  // Knee should stay above ankle (not collapse inward)
  const kneeInwardOffset = Math.abs(lKnee.x - lAnkle.x);
  const hipWidth = Math.abs(lHip.x - findKeypoint(keypoints, 'right_hip')?.x || 0);

  if (kneeInwardOffset > hipWidth * 0.3) {
    return {
      risk: 'Knee Collapse',
      severity: 'high',
      message: '⚠️ Knees are caving inward. Push knees outward over toes to prevent knee injury.',
      icon: '🦵',
    };
  }
  return null;
};

/**
 * Detect excessive lower back curvature
 */
const detectBackCurvature = (keypoints) => {
  const lShoulder = findKeypoint(keypoints, 'left_shoulder');
  const lHip = findKeypoint(keypoints, 'left_hip');
  const lKnee = findKeypoint(keypoints, 'left_knee');

  if (!lShoulder || !lHip || !lKnee) return null;

  const backAngle = calculateAngle(lShoulder, lHip, { x: lHip.x, y: lHip.y - 0.3 });

  if (backAngle > RISK_THRESHOLDS.backCurvature) {
    return {
      risk: 'Excessive Back Lean',
      severity: 'high',
      message: '⚠️ Excessive forward lean detected. Engage your core and keep your chest up.',
      icon: '🔴',
    };
  }
  return null;
};

/**
 * Detect left-right asymmetry (uneven weight distribution)
 */
const detectAsymmetry = (keypoints) => {
  const lShoulder = findKeypoint(keypoints, 'left_shoulder');
  const rShoulder = findKeypoint(keypoints, 'right_shoulder');
  const lHip = findKeypoint(keypoints, 'left_hip');
  const rHip = findKeypoint(keypoints, 'right_hip');

  if (!lShoulder || !rShoulder || !lHip || !rHip) return null;

  const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y);
  const hipTilt = Math.abs(lHip.y - rHip.y);

  if (shoulderTilt > 0.05 || hipTilt > 0.05) {
    return {
      risk: 'Uneven Weight Distribution',
      severity: 'medium',
      message: '⚠️ Your body is tilting to one side. Distribute weight evenly on both feet.',
      icon: '⚖️',
    };
  }
  return null;
};

/**
 * Detect neck strain (forward head position)
 */
const detectNeckStrain = (keypoints) => {
  const nose = findKeypoint(keypoints, 'nose');
  const lShoulder = findKeypoint(keypoints, 'left_shoulder');
  const rShoulder = findKeypoint(keypoints, 'right_shoulder');

  if (!nose || !lShoulder || !rShoulder) return null;

  const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
  const forwardOffset = nose.x - shoulderMidX;

  if (Math.abs(forwardOffset) > 0.08) {
    return {
      risk: 'Neck Strain',
      severity: 'medium',
      message: '⚠️ Keep your head neutral — avoid jutting your chin forward.',
      icon: '🤕',
    };
  }
  return null;
};

/**
 * Run all injury risk checks on current pose
 * @returns {Array} list of detected risks
 */
export const detectInjuryRisks = (keypoints, exercise) => {
  if (!keypoints || keypoints.length === 0) return [];

  const risks = [];

  // Always check asymmetry and neck
  const asymmetry = detectAsymmetry(keypoints);
  if (asymmetry) risks.push(asymmetry);

  const neck = detectNeckStrain(keypoints);
  if (neck) risks.push(neck);

  // Exercise-specific checks
  if (exercise === 'squats' || exercise === 'lunges') {
    const kneeCollapse = detectKneeCollapse(keypoints);
    if (kneeCollapse) risks.push(kneeCollapse);

    const backCurve = detectBackCurvature(keypoints);
    if (backCurve) risks.push(backCurve);
  }

  if (exercise === 'pushups') {
    const backCurve = detectBackCurvature(keypoints);
    if (backCurve) risks.push(backCurve);
  }

  return risks;
};
