/**
 * Strivio Wearable Integration Stub
 * Provides a unified API surface for wearable data (Fitbit, Apple HealthKit, Google Fit).
 * Currently uses simulated data; replace with native SDKs when available.
 */

let heartRateHistory = [];
let connected = false;

/**
 * Attempt to connect to a wearable source
 * @param {string} source - 'fitbit' | 'healthkit' | 'googlefit'
 * @returns {Promise<boolean>}
 */
export const connectWearable = async (source) => {
  // Stub: In production, initialize the native SDK here
  console.log(`[Wearable] Attempting connection to ${source}...`);
  connected = false; // Will be true when real SDK is integrated
  return connected;
};

/**
 * Get the latest heart rate reading
 * @returns {{ bpm: number, timestamp: number, source: string } | null}
 */
export const getHeartRate = () => {
  if (!connected) return null;
  // Stub: return simulated heart rate
  const bpm = 70 + Math.round(Math.random() * 60);
  const reading = { bpm, timestamp: Date.now(), source: 'simulated' };
  heartRateHistory.push(reading);
  return reading;
};

/**
 * Get today's step count from wearable
 * @returns {Promise<number>}
 */
export const getSteps = async () => {
  if (!connected) return 0;
  // Stub: real implementation would call HealthKit/Google Fit
  return 0;
};

/**
 * Fuse wearable heart rate with pose confidence for better accuracy assessment
 * @param {number} poseConfidence - 0-1 confidence from pose detection
 * @returns {{ adjustedConfidence: number, heartRate: number | null }}
 */
export const fuseWithPoseData = (poseConfidence) => {
  const hr = getHeartRate();
  if (!hr) return { adjustedConfidence: poseConfidence, heartRate: null };

  // If heart rate is very elevated (>160), user is likely working hard
  // even if pose confidence dips — reduce false "step into frame" warnings
  let adjustedConfidence = poseConfidence;
  if (hr.bpm > 140 && poseConfidence > 0.4) {
    adjustedConfidence = Math.min(1, poseConfidence + 0.15);
  }

  return { adjustedConfidence, heartRate: hr.bpm };
};

/**
 * Check connection status
 */
export const isConnected = () => connected;

/**
 * Disconnect and reset
 */
export const disconnectWearable = () => {
  connected = false;
  heartRateHistory = [];
};
