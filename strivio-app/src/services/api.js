import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Auto-detect: web uses localhost, device/emulator uses LAN IP
// You should define EXPO_PUBLIC_API_URL in a .env file in the strivio-app directory
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : 'http://localhost:5000/api');

export const SOCKET_URL = API_URL.replace('/api', '');

const getToken = async () => {
  return await AsyncStorage.getItem('strivio_token');
};

// Timeout wrapper to prevent hanging
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
  ]);
};

const api = {
  // Auth
  register: async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  verifyLoginMFA: async (userId, code) => {
    const res = await fetch(`${API_URL}/auth/login/verify-mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });
    return res.json();
  },

  getProfile: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  updateProfile: async (updates) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Exercises
  getExercises: async () => {
    const res = await fetch(`${API_URL}/exercises`);
    return res.json();
  },

  // Workout Plans
  getWorkoutPlans: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/workout-plans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createWorkoutPlan: async (plan) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/workout-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(plan),
    });
    return res.json();
  },

  // Workout Sessions
  getWorkoutSessions: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/workout-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  saveWorkoutSession: async (session) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/workout-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(session),
    });
    return res.json();
  },

  // Progress
  getProgress: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Achievements
  getAchievements: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Nutrition
  getNutritionLogs: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/nutrition-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  logNutrition: async (log) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/nutrition-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(log),
    });
    return res.json();
  },

  // Challenges
  getChallenges: async () => {
    const res = await fetch(`${API_URL}/challenges`);
    return res.json();
  },

  joinChallenge: async (challengeId) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/challenges/${challengeId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // AI Insights
  getAIInsights: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/ai-insights`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Wearable HealthKit Sync
  syncHealthData: async (data) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/health-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ============ TRACKING ============
  getBodyMeasurements: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/body-measurements`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  logBodyMeasurement: async (data) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/body-measurements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getSleepLogs: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/sleep`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  logSleep: async (data) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/sleep`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getMoodLogs: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/mood`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  logMood: async (data) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/mood`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getHydration: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/hydration`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  logHydration: async (data) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/hydration`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  startFasting: async (targetHours) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/fasting/start`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetHours }),
    });
    return res.json();
  },
  endFasting: async (id) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/fasting/${id}/end`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  getFastingLogs: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/fasting`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  getDailyCheckin: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/daily-checkin`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  // ============ FOOD SEARCH ============
  searchFood: async (query) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/tracking/food-search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ DEVICE INTEGRATIONS ============
  getConnectedDevices: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/devices`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  connectGarmin: async (username, password) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/garmin/connect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },
  connectFitbit: async (data) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/fitbit/connect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  disconnectDevice: async (provider) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/devices/${provider}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ============ FAMILY ACCESS ============
  createFamily: async (name) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/family/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  joinFamily: async (inviteCode) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/family/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inviteCode }),
    });
    return res.json();
  },
  getFamily: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/integrations/family`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  // ============ MFA ============
  setupMFA: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/auth/mfa/setup`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  verifyMFA: async (code) => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/auth/mfa/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    return res.json();
  },
  getMFAStatus: async () => {
    const token = await getToken();
    const res = await fetch(`${API_URL}/auth/mfa/status`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
};

export default api;

