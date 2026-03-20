/**
 * Signal Collector Service - DEMO READY VERSION
 * 
 * Collects HR/HRV from smart band (simulated for demo) and pose estimation 
 * data from camera to feed into the fatigue monitoring system.
 * 
 * DEMO MODE: Uses mock signals for presentation. In production, replace
 * with real Fitbit/Garmin APIs + MediaPipe pose detection.
 */

// Simulated baseline values (in production, these come from user profile)
const USER_BASELINE_HR = 70;
const USER_BASELINE_HRV = 50;

/**
 * DEMO: Collect mock signals for presentation
 * In production, this fetches from smart band + MediaPipe
 * 
 * @returns {Promise<Object>} Collected biometric signals
 */
export async function collectSignals() {
  // Simulate API latency for realistic demo
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // DEMO: Simulated live signals showing fatigue indicators
  // HR elevated above baseline (+25 BPM indicates stress)
  // HRV dropped from baseline (40 vs 50 indicates autonomic fatigue)
  // Rep speed slowed (0.4 reps/sec vs normal 0.8)
  // ROM reduced (25° vs normal 70° indicates joint fatigue)
  
  return {
    hr: 95,              // Elevated heart rate (baseline: 70)
    hrv: 40,             // HRV drop (baseline: 50)
    baselineHR: USER_BASELINE_HR,
    baselineHRV: USER_BASELINE_HRV,
    repSpeed: 0.4,       // Slower reps indicating muscular fatigue
    rom: 25,             // Reduced range of motion
    timestamp: Date.now()
  };
}

/**
 * DEMO: Collect fresh signals (high fatigue state)
 * Use this to show the "FRESH" state in demo
 */
export async function collectFreshSignals() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    hr: 72,              // Near baseline
    hrv: 52,             // Good HRV
    baselineHR: USER_BASELINE_HR,
    baselineHRV: USER_BASELINE_HRV,
    repSpeed: 0.9,       // Fast reps
    rom: 75,             // Full ROM
    timestamp: Date.now()
  };
}

/**
 * DEMO: Collect moderate fatigue signals
 * Use this to show the "MODERATE" state in demo
 */
export async function collectModerateSignals() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    hr: 85,              // Slightly elevated
    hrv: 45,             // Slight HRV drop
    baselineHR: USER_BASELINE_HR,
    baselineHRV: USER_BASELINE_HRV,
    repSpeed: 0.6,       // Moderate speed
    rom: 55,             // Slight ROM reduction
    timestamp: Date.now()
  };
}

/**
 * DEMO: Collect critical fatigue signals
 * Use this to show the "CRITICAL" state in demo
 */
export async function collectCriticalSignals() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    hr: 110,             // Very elevated HR
    hrv: 30,             // Significant HRV drop
    baselineHR: USER_BASELINE_HR,
    baselineHRV: USER_BASELINE_HRV,
    repSpeed: 0.25,      // Very slow reps
    rom: 15,             // Severely limited ROM
    timestamp: Date.now()
  };
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
