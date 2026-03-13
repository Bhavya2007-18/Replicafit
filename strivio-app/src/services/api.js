import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Auto-detect: web uses localhost, device/emulator uses LAN IP
// You should define EXPO_PUBLIC_API_URL in a .env file in the strivio-app directory
const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : 'http://localhost:5000/api');

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
};

export default api;
