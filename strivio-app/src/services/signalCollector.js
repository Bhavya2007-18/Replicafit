/**
 * Signal Collector Service
 * Collects HR/HRV from smart band and pose estimation data from camera
 */

import { requestHealthData } from './healthConnect';

// Simulated baseline values (in production, these come from user profile)
const USER_BASELINE_HR = 70;
const USER_BASELINE_HRV = 55;

/**
 * Collect signals from smart band and camera
 * @returns {Promise<Object>} Collected signals
 */
export async function collectSignals() {
  try {
    // Fetch HR/HRV from smart band via Health Connect
    const healthData = await requestHealthData();
    
    // Get pose estimation data from MediaPipe (via global or context)
    const poseData = getLatestPoseData();
    
    // Calculate rep speed from recent reps
    const repSpeed = calculateRepSpeed();
    
    // Calculate ROM from pose angles
    const rom = calculateRangeOfMotion(poseData);
    
    return {
      hr: healthData.heartRate || USER_BASELINE_HR,
      hrv: healthData.hrv || USER_BASELINE_HRV,
      baselineHR: USER_BASELINE_HR,
      baselineHRV: USER_BASELINE_HRV,
      repSpeed,
      rom,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error collecting signals:', error);
    // Return default values on error
    return {
      hr: USER_BASELINE_HR,
      hrv: USER_BASELINE_HRV,
      baselineHR: USER_BASELINE_HR,
      baselineHRV: USER_BASELINE_HRV,
      repSpeed: 0.8,
      rom: 70,
      timestamp: Date.now(),
      error: error.message
    };
  }
}

/**
 * Get latest pose data from MediaPipe detection
 * @returns {Object} Pose keypoints and angles
 */
function getLatestPoseData() {
  // In production, this reads from global state or context
  // where MediaPipe stores the latest detection
  if (global.latestPoseData) {
    return global.latestPoseData;
  }
  
  // Default mock data for testing
  return {
    keypoints: [],
    angles: {},
    timestamp: Date.now()
  };
}

/**
 * Calculate rep speed based on recent timestamps
 * @returns {number} Reps per second
 */
function calculateRepSpeed() {
  // In production, this analyzes rep timestamps
  // For now, return a mock value
  const repTimestamps = global.repTimestamps || [];
  
  if (repTimestamps.length < 2) {
    return 0.8; // Default moderate speed
  }
  
  const recentReps = repTimestamps.slice(-5);
  const timeDiff = recentReps[recentReps.length - 1] - recentReps[0];
  const repCount = recentReps.length - 1;
  
  if (timeDiff <= 0) return 0.8;
  
  return repCount / (timeDiff / 1000); // reps per second
}

/**
 * Calculate range of motion from pose angles
 * @param {Object} poseData - Pose estimation data
 * @returns {number} ROM in degrees
 */
function calculateRangeOfMotion(poseData) {
  if (!poseData || !poseData.angles) {
    return 70; // Default moderate ROM
  }
  
  const angles = poseData.angles;
  
  // Example: For squats, check knee angle range
  if (angles.leftKnee && angles.rightKnee) {
    const kneeRom = Math.abs(angles.leftKnee - angles.rightKnee);
    return Math.min(180, kneeRom);
  }
  
  // For pushups, check elbow angle range
  if (angles.leftElbow && angles.rightElbow) {
    const elbowRom = Math.abs(angles.leftElbow - angles.rightElbow);
    return Math.min(180, elbowRom);
  }
  
  return 70; // Default
}

/**
 * Store rep timestamp for speed calculation
 * @param {number} timestamp - Rep completion timestamp
 */
export function recordRep(timestamp = Date.now()) {
  if (!global.repTimestamps) {
    global.repTimestamps = [];
  }
  global.repTimestamps.push(timestamp);
  
  // Keep only last 10 timestamps
  if (global.repTimestamps.length > 10) {
    global.repTimestamps.shift();
  }
}

/**
 * Update pose data globally
 * @param {Object} poseData - Latest pose detection data
 */
export function updatePoseData(poseData) {
  global.latestPoseData = poseData;
}

/**
 * Reset signal collection state
 */
export function resetSignalCollector() {
  global.repTimestamps = [];
  global.latestPoseData = null;
}

/**
 * Get current baseline values for user
 * @returns {Object} Baseline HR and HRV
 */
export function getUserBaselines() {
  return {
    baselineHR: USER_BASELINE_HR,
    baselineHRV: USER_BASELINE_HRV
  };
}
