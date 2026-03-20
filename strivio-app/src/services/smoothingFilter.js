/**
 * Strivio Smoothing Filter
 * Applies a moving average (deque) to joint coordinates and angles
 * to eliminate jitter/noise from camera-based pose estimation.
 */

const WINDOW_SIZE = 5; // Number of frames to average over
const keypointBuffers = {}; // { keypointName: [{ x, y, score }, ...] }
const angleBuffers = {};    // { angleName: [value, ...] }

/**
 * Smooth a single keypoint using a rolling average
 * @param {string} name - keypoint name (e.g. 'left_knee')
 * @param {{ x: number, y: number, score: number }} kp
 * @returns {{ x: number, y: number, score: number }}
 */
export const smoothKeypoint = (name, kp) => {
  if (!kp || typeof kp.x !== 'number') return kp;

  if (!keypointBuffers[name]) keypointBuffers[name] = [];
  const buf = keypointBuffers[name];
  buf.push({ x: kp.x, y: kp.y, score: kp.score || 0 });
  if (buf.length > WINDOW_SIZE) buf.shift();

  const len = buf.length;
  return {
    x: buf.reduce((s, p) => s + p.x, 0) / len,
    y: buf.reduce((s, p) => s + p.y, 0) / len,
    score: buf.reduce((s, p) => s + p.score, 0) / len,
  };
};

/**
 * Smooth all keypoints in an array
 * @param {Array} keypoints - array of { name, x, y, score }
 * @returns {Array} smoothed keypoints
 */
export const smoothKeypoints = (keypoints) => {
  if (!keypoints || keypoints.length === 0) return keypoints;
  return keypoints.map(kp => ({
    ...kp,
    ...smoothKeypoint(kp.name, kp),
    name: kp.name,
  }));
};

/**
 * Smooth a single angle value using a rolling average
 * @param {string} name - angle name (e.g. 'kneeAngle')
 * @param {number} value
 * @returns {number} smoothed angle
 */
export const smoothAngle = (name, value) => {
  if (typeof value !== 'number' || isNaN(value)) return value;

  if (!angleBuffers[name]) angleBuffers[name] = [];
  const buf = angleBuffers[name];
  buf.push(value);
  if (buf.length > WINDOW_SIZE) buf.shift();

  return buf.reduce((s, v) => s + v, 0) / buf.length;
};

/**
 * Smooth all angles in an object
 * @param {object} angles - { kneeAngle: 90, hipAngle: 120, ... }
 * @returns {object} smoothed angles
 */
export const smoothAngles = (angles) => {
  if (!angles) return angles;
  const smoothed = {};
  for (const [name, value] of Object.entries(angles)) {
    smoothed[name] = smoothAngle(name, value);
  }
  return smoothed;
};

/**
 * Reset all buffers (call when starting a new workout)
 */
export const resetSmoothingBuffers = () => {
  for (const key of Object.keys(keypointBuffers)) delete keypointBuffers[key];
  for (const key of Object.keys(angleBuffers)) delete angleBuffers[key];
};
