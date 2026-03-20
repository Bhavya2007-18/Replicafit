/**
 * Strivio Fatigue Detection Engine
 * Tracks rep speed degradation and form quality over time
 * to estimate fatigue level and recommend rest.
 */

let repTimestamps = [];
let formScores = [];

/**
 * Record a completed rep with its timing and form score
 */
export const recordRep = (accuracy) => {
  repTimestamps.push(Date.now());
  formScores.push(accuracy);
};

/**
 * Analyze fatigue based on rep speed trend and form degradation
 * @returns {{ fatigue_level: string, recommendation: string, repSpeeds: number[] }}
 */
export const analyzeFatigue = () => {
  if (repTimestamps.length < 3) {
    return { fatigue_level: 'low', recommendation: 'Keep going — too early to assess fatigue.', repSpeeds: [] };
  }

  // Calculate rep durations (time between consecutive reps)
  const repSpeeds = [];
  for (let i = 1; i < repTimestamps.length; i++) {
    repSpeeds.push((repTimestamps[i] - repTimestamps[i - 1]) / 1000); // seconds
  }

  // Compare first-half speed vs second-half speed
  const mid = Math.floor(repSpeeds.length / 2);
  const firstHalfAvg = repSpeeds.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalfAvg = repSpeeds.slice(mid).reduce((a, b) => a + b, 0) / (repSpeeds.length - mid);
  const speedDegradation = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  // Compare first-half form vs second-half form
  const firstFormAvg = formScores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondFormAvg = formScores.slice(mid).reduce((a, b) => a + b, 0) / (formScores.length - mid);
  const formDegradation = firstFormAvg - secondFormAvg; // positive = getting worse

  // Determine fatigue level
  let fatigue_level = 'low';
  let recommendation = 'Looking strong, keep it up!';

  if (speedDegradation > 40 || formDegradation > 25) {
    fatigue_level = 'high';
    recommendation = '⚠️ High fatigue detected — consider resting before your next set.';
  } else if (speedDegradation > 20 || formDegradation > 12) {
    fatigue_level = 'medium';
    recommendation = 'Moderate fatigue — focus on maintaining form quality.';
  }

  return { fatigue_level, recommendation, repSpeeds };
};

/**
 * Reset fatigue tracker for a new set/exercise
 */
export const resetFatigueTracker = () => {
  repTimestamps = [];
  formScores = [];
};
