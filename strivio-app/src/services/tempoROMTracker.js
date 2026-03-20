/**
 * Strivio Tempo & ROM Tracker
 * Measures rep tempo, range of motion boundaries,
 * and left/right symmetry scoring per exercise.
 */

let repStartTime = null;
let repTempos = [];
let romHistory = { min: {}, max: {} }; // { leftKnee: { min: 40, max: 170 } }
let symmetryScores = [];

/**
 * Signal the start of a new rep
 */
export const markRepStart = () => {
  repStartTime = Date.now();
};

/**
 * Signal the end of a rep and record tempo
 * @returns {number} tempo in seconds for this rep
 */
export const markRepEnd = () => {
  if (!repStartTime) return 0;
  const tempo = (Date.now() - repStartTime) / 1000;
  repTempos.push(tempo);
  repStartTime = null;
  return tempo;
};

/**
 * Record joint angles for ROM tracking
 * @param {object} angles - e.g. { leftKnee: 85, rightKnee: 88, leftElbow: 150 }
 */
export const recordAnglesForROM = (angles) => {
  if (!angles) return;
  for (const [joint, angle] of Object.entries(angles)) {
    if (typeof angle !== 'number' || isNaN(angle)) continue;
    if (!romHistory.min[joint] || angle < romHistory.min[joint]) {
      romHistory.min[joint] = angle;
    }
    if (!romHistory.max[joint] || angle > romHistory.max[joint]) {
      romHistory.max[joint] = angle;
    }
  }
};

/**
 * Calculate symmetry score from left/right angle pairs
 * @param {object} angles - must contain leftX and rightX pairs
 * @returns {number} symmetry score 0-100 (100 = perfectly balanced)
 */
export const calculateSymmetry = (angles) => {
  if (!angles) return 100;

  const pairs = [
    ['leftKnee', 'rightKnee'],
    ['leftElbow', 'rightElbow'],
    ['leftHip', 'rightHip'],
    ['leftShoulder', 'rightShoulder'],
  ];

  let totalDiff = 0;
  let pairCount = 0;

  for (const [left, right] of pairs) {
    if (angles[left] != null && angles[right] != null) {
      totalDiff += Math.abs(angles[left] - angles[right]);
      pairCount++;
    }
  }

  if (pairCount === 0) return 100;

  const avgDiff = totalDiff / pairCount;
  const score = Math.max(0, Math.round(100 - avgDiff * 2)); // 2 points off per degree of diff
  symmetryScores.push(score);
  return score;
};

/**
 * Get accumulated session metrics
 */
export const getTempoROMSummary = () => {
  const avgTempo = repTempos.length > 0
    ? (repTempos.reduce((a, b) => a + b, 0) / repTempos.length).toFixed(1)
    : '0.0';
  const avgSymmetry = symmetryScores.length > 0
    ? Math.round(symmetryScores.reduce((a, b) => a + b, 0) / symmetryScores.length)
    : 100;

  return {
    avgTempo: parseFloat(avgTempo),
    totalReps: repTempos.length,
    rom: { min: { ...romHistory.min }, max: { ...romHistory.max } },
    avgSymmetry,
    repTempos: [...repTempos],
  };
};

/**
 * Reset for a new workout/exercise
 */
export const resetTempoROM = () => {
  repStartTime = null;
  repTempos = [];
  romHistory = { min: {}, max: {} };
  symmetryScores = [];
};
