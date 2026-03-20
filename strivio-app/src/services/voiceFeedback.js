/**
 * Strivio Voice Feedback Engine
 * Uses expo-speech for real-time audio coaching cues.
 * Throttled to avoid overlapping speech.
 */
import * as Speech from 'expo-speech';

let lastSpokenTime = 0;
const MIN_INTERVAL_MS = 4000; // Don't speak more than once every 4 seconds
let enabled = true;

/**
 * Enable or disable voice feedback globally
 */
export const setVoiceEnabled = (val) => { enabled = val; };

/**
 * Speak a coaching cue, throttled to avoid spamming
 * @param {string} text - The text to speak
 * @param {string} priority - 'low', 'medium', 'high'. High bypasses throttle.
 */
export const speakFeedback = (text, priority = 'medium') => {
  if (!enabled || !text) return;

  const now = Date.now();
  if (priority !== 'high' && (now - lastSpokenTime) < MIN_INTERVAL_MS) return;

  lastSpokenTime = now;
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 1.05,
  });
};

/**
 * Speak rep completion
 */
export const announceRep = (repCount) => {
  speakFeedback(`Rep ${repCount}`, 'low');
};

/**
 * Speak a form correction
 */
export const announceCorrection = (correction) => {
  speakFeedback(correction, 'medium');
};

/**
 * Speak a fatigue warning
 */
export const announceFatigue = (level) => {
  if (level === 'high') {
    speakFeedback('Warning. High fatigue detected. Consider resting.', 'high');
  } else if (level === 'medium') {
    speakFeedback('Moderate fatigue. Focus on form.', 'medium');
  }
};

/**
 * Stop any current speech
 */
export const stopSpeech = () => {
  Speech.stop();
};
