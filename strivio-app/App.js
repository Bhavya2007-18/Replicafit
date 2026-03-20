import React, { useEffect, useState } from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import WorkoutPlansScreen from './src/screens/WorkoutPlansScreen';
import ExerciseLibraryScreen from './src/screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import GuidedWorkoutScreen from './src/screens/GuidedWorkoutScreen';
import DietGuidelinesScreen from './src/screens/DietGuidelinesScreen';
import ProgressDashboardScreen from './src/screens/ProgressDashboardScreen';
import GoalTrackingScreen from './src/screens/GoalTrackingScreen';
import AICoachChatScreen from './src/screens/AICoachChatScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FatigueMonitorScreen from './src/screens/FatigueMonitorScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#cafd00" />
        <Text style={{ color: '#aaa', marginTop: 10, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>INITIALIZING REPLICAFIT...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !user.onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} />
          <Stack.Screen name="WorkoutPlans" component={WorkoutPlansScreen} />
          <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
          <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
          <Stack.Screen name="GuidedWorkout" component={GuidedWorkoutScreen} />
          <Stack.Screen name="DietGuidelines" component={DietGuidelinesScreen} />
          <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
          <Stack.Screen name="GoalTracking" component={GoalTrackingScreen} />
          <Stack.Screen name="AICoachChat" component={AICoachChatScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="FatigueMonitor" component={FatigueMonitorScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function App() {
  const [isTfReady, setIsTfReady] = useState(false);

  useEffect(() => {
    async function initTf() {
      try {
        console.log('🔄 Initializing AI Engine...');
        await tf.ready();
        setIsTfReady(true);
        console.log('✅ TF.js is ready');
      } catch (err) {
        console.warn('⚠️ TF.js init failed (App will continue in fallback mode):', err.message);
        setIsTfReady(true); // Don't block the app if AI fails
      }
    }
    initTf();
  }, []);

  if (!isTfReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#cafd00" />
        <Text style={{ color: '#aaa', marginTop: 10, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>INITIALIZING REPLICAFIT AI...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
});

export default App;
registerRootComponent(App);
