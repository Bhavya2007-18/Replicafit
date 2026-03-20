import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { smoothKeypoints } from './smoothingFilter';
import { Buffer } from 'buffer';

/**
 * Strivio Pose Detection Service
 * Real-time keypoint extraction using TensorFlow.js MoveNet.
 */

export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

export const SKELETON_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

const MIN_CONFIDENCE = 0.35;
const VISIBILITY_THRESHOLD = 0.5; // Stricter threshold for "reliable" joints
let detector = null;
let isInitialized = false;

/**
 * Initialize pose detection (Real TF.js MoveNet)
 */
export const initializePoseDetection = async () => {
  try {
    await tf.ready();
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true
    };
    detector = await poseDetection.createDetector(model, detectorConfig);
    isInitialized = true;
    console.log('✅ Real Pose Detection Service Initialized');
    return true;
  } catch (error) {
    console.warn('❌ Failed to initialize pose detection:', error.message);
    return false;
  }
};

/**
 * Detect pose from real camera frames
 */
export const detectPose = async (frameData) => {
  if (!isInitialized || !detector || !frameData.uri) {
    return { keypoints: [], isReliable: false, avgConfidence: 0 };
  }

  try {
    let imgB64 = '';
    if (frameData.base64) {
      imgB64 = frameData.base64;
    } else if (frameData.uri.startsWith('data:image')) {
      imgB64 = frameData.uri.split(',')[1];
    } else {
      imgB64 = await FileSystem.readAsStringAsync(frameData.uri, { encoding: FileSystem.EncodingType.Base64 });
    }

    const imgBuffer = Buffer.from(imgB64, 'base64');
    const rawImageData = new Uint8Array(imgBuffer);
    const imageTensor = decodeJpeg(rawImageData);

    // 2. Run detection
    const poses = await detector.estimatePoses(imageTensor);
    tf.dispose(imageTensor); // Free memory 🚀

    if (poses && poses.length > 0) {
      const pose = poses[0];
      const rawKeypoints = pose.keypoints.map(kp => ({
        name: kp.name,
        x: kp.x / frameData.width,
        y: kp.y / frameData.height,
        score: kp.score
      }));

      // Apply smoothing filter to reduce jitter
      const keypoints = smoothKeypoints(rawKeypoints);

      const avgConfidence = pose.score || 0;
      
      // Use stricter visibility threshold for reliability check
      const criticalJoints = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'];
      const reliableCount = keypoints.filter(kp => 
        criticalJoints.includes(kp.name) && kp.score >= VISIBILITY_THRESHOLD
      ).length;

      return {
        keypoints,
        isReliable: reliableCount >= 3 && avgConfidence >= MIN_CONFIDENCE,
        avgConfidence
      };
    }

    return { keypoints: [], isReliable: false, avgConfidence: 0 };
  } catch (error) {
    // console.warn('⚠️ Detection failure:', error.message);
    return { keypoints: [], isReliable: false, avgConfidence: 0 };
  }
};

export const findKeypoint = (keypoints, name) => {
  return keypoints.find(kp => kp.name === name);
};

export const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

export const disposePoseDetection = () => {
  if (detector) {
    detector.dispose();
    detector = null;
  }
  isInitialized = false;
};
