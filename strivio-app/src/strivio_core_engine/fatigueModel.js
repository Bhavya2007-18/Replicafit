/**
 * Fatigue Monitoring Model
 * Fuses smart band signals (HR/HRV) with camera pose estimation (ROM, rep speed)
 * to compute a fatigue score and generate doctor-style feedback.
 */

// Baseline defaults for new users
const DEFAULT_BASELINE_HR = 70;
const DEFAULT_BASELINE_HRV = 50;

/**
 * Compute fatigue score based on physiological and biomechanical signals
 * @param {Object} signals - Collected signals from sensors
 * @param {number} signals.hr - Current heart rate
 * @param {number} signals.hrv - Current heart rate variability (RMSSD)
 * @param {number} signals.baselineHR - User's resting heart rate
 * @param {number} signals.baselineHRV - User's baseline HRV
 * @param {number} signals.repSpeed - Repetition speed (reps per second)
 * @param {number} signals.rom - Range of motion (degrees)
 * @returns {number} Fatigue score (0-100)
 */
function computeFatigueScore({ hr, hrv, baselineHR, baselineHRV, repSpeed, rom }) {
  // Use defaults if baselines not provided
  const baseHR = baselineHR || DEFAULT_BASELINE_HR;
  const baseHRV = baselineHRV || DEFAULT_BASELINE_HRV;
  
  let score = 0;
  
  // HRV drop indicates autonomic fatigue
  const hrvDrop = baseHRV > 0 ? (baseHRV - hrv) / baseHRV : 0;
  score += Math.max(0, hrvDrop) * 40; // Max 40 points from HRV
  
  // Slow reps indicate muscular fatigue
  if (repSpeed < 0.5) {
    score += 20; // Max 20 points from rep speed
  } else if (repSpeed < 0.8) {
    score += 10; // Partial fatigue
  }
  
  // Reduced ROM indicates joint/muscle fatigue
  if (rom < 30) {
    score += 20; // Max 20 points from ROM
  } else if (rom < 60) {
    score += 10; // Partial ROM reduction
  }
  
  // Elevated HR indicates cardiovascular stress
  const hrElevated = hr - (baseHR + 20);
  if (hrElevated > 0) {
    score += Math.min(20, hrElevated); // Max 20 points from HR
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Generate doctor-style feedback based on fatigue score
 * @param {number} score - Fatigue score (0-100)
 * @param {string} exerciseName - Current exercise name (optional)
 * @returns {string} Personalized feedback message
 */
function generateFeedback(score, exerciseName = '') {
  const exerciseContext = exerciseName ? ` during ${exerciseName}` : '';
  
  if (score > 80) {
    return `⚠️ Critical fatigue detected${exerciseContext}. Heart rate and HRV indicate severe autonomic stress. Stop immediately and rest 3-5 minutes. Hydrate and monitor recovery.`;
  }
  
  if (score > 60) {
    return `⚠️ High fatigue detected${exerciseContext}. Your rep speed and range of motion have decreased significantly. Rest 2-3 minutes before continuing.`;
  }
  
  if (score > 40) {
    return `Moderate fatigue${exerciseContext}. Consider switching to lighter sets or alternate muscle groups. Maintain proper form to prevent injury.`;
  }
  
  if (score > 20) {
    return `Low fatigue${exerciseContext}. You're performing well but showing early signs of tiredness. Continue with current intensity, monitor HR.`;
  }
  
  return `✅ You're fresh and ready${exerciseContext}! Heart rate variability and movement quality are optimal. Continue your workout at current intensity.`;
}

/**
 * Analyze exercise quality based on multiple factors
 * @param {Object} data - Exercise data
 * @returns {Object} Quality metrics
 */
function analyzeExerciseQuality({ repSpeed, rom, hr, hrv, baselineHR, baselineHRV }) {
  const baseHR = baselineHR || DEFAULT_BASELINE_HR;
  const baseHRV = baselineHRV || DEFAULT_BASELINE_HRV;
  
  return {
    power: repSpeed > 1.0 ? 'High' : repSpeed > 0.5 ? 'Moderate' : 'Low',
    mobility: rom > 80 ? 'Excellent' : rom > 60 ? 'Good' : rom > 30 ? 'Fair' : 'Limited',
    cardioStress: hr > baseHR + 30 ? 'High' : hr > baseHR + 15 ? 'Moderate' : 'Normal',
    recoveryStatus: hrv > baseHRV ? 'Good' : hrv > baseHRV * 0.8 ? 'Fair' : 'Poor',
  };
}

/**
 * Calculate recovery time recommendation
 * @param {number} fatigueScore - Current fatigue score
 * @returns {string} Recovery recommendation
 */
function getRecoveryRecommendation(fatigueScore) {
  if (fatigueScore > 70) {
    return 'Rest: 3-5 min | Next set: -40% weight';
  }
  if (fatigueScore > 50) {
    return 'Rest: 2-3 min | Next set: -20% weight';
  }
  if (fatigueScore > 30) {
    return 'Rest: 1-2 min | Continue or reduce weight slightly';
  }
  return 'Rest: 30-60 sec | Maintain intensity';
}

module.exports = { 
  computeFatigueScore, 
  generateFeedback, 
  analyzeExerciseQuality,
  getRecoveryRecommendation,
  DEFAULT_BASELINE_HR,
  DEFAULT_BASELINE_HRV
};
