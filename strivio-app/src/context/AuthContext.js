import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('strivio_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await api.getProfile();
          if (profile && !profile.error) {
            setUser(profile);
          } else {
            await AsyncStorage.removeItem('strivio_token');
            setToken(null);
          }
        } catch (e) {
          // Server unreachable — clear token, show login
          console.log('Server unreachable, showing login');
          await AsyncStorage.removeItem('strivio_token');
          setToken(null);
        }
      }
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await api.login(email, password);
    if (result.token) {
      await AsyncStorage.setItem('strivio_token', result.token);
      setToken(result.token);
      setUser(result.user);
    }
    return result;
  };

  const register = async (name, email, password) => {
    const result = await api.register(name, email, password);
    if (result.token) {
      await AsyncStorage.setItem('strivio_token', result.token);
      setToken(result.token);
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('strivio_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const continueAsGuest = () => {
    setUser({
      name: 'Athlete',
      email: 'guest@strivio.ai',
      onboardingComplete: true,
      profile: { age: 25, height: 170, weight: 70, goal: 'muscle_gain', activityLevel: 'moderate' },
      xp: 0,
      level: 1,
      streak: 0,
      isGuest: true,
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
