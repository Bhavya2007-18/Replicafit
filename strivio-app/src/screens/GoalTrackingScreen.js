import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function GoalTrackingScreen({ navigation }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const p = await api.getProgress();
      if (p) setProgress(p);
      const s = await api.getWorkoutSessions();
      if (Array.isArray(s)) setSessions(s);
    } catch (e) { }
  };

  const goal = user?.profile?.goal || 'muscle_gain';
  const goalLabel = goal.replace('_', ' ').toUpperCase();

  // Calculate goal-specific targets
  const weeklyTarget = 5;
  const weekSessions = sessions.filter(s => (Date.now() - new Date(s.completedAt).getTime()) < 7 * 86400000).length;
  const weekProgress = Math.min(100, Math.round((weekSessions / weeklyTarget) * 100));

  const monthSessions = sessions.filter(s => (Date.now() - new Date(s.completedAt).getTime()) < 30 * 86400000).length;
  const monthTarget = 20;
  const monthProgress = Math.min(100, Math.round((monthSessions / monthTarget) * 100));

  const accuracyTarget = 80;
  const accuracyProgress = Math.min(100, Math.round(((progress?.avgAccuracy || 0) / accuracyTarget) * 100));

  const goals = [
    { title: 'Weekly Workouts', current: weekSessions, target: weeklyTarget, progress: weekProgress, icon: '📅' },
    { title: 'Monthly Workouts', current: monthSessions, target: monthTarget, progress: monthProgress, icon: '📆' },
    { title: 'Form Accuracy', current: `${progress?.avgAccuracy || 0}%`, target: `${accuracyTarget}%`, progress: accuracyProgress, icon: '🎯' },
    { title: 'Workout Streak', current: progress?.streak || 0, target: '30 days', progress: Math.min(100, Math.round(((progress?.streak || 0) / 30) * 100)), icon: '🔥' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Goal Tracking</Text>

        {/* Active Goal Banner */}
        <View style={s.banner}>
          <Text style={s.bannerLabel}>ACTIVE GOAL</Text>
          <Text style={s.bannerGoal}>{goalLabel}</Text>
          <Text style={s.bannerSub}>Level {progress?.level || 1} • {progress?.xp || 0} XP</Text>
        </View>

        {/* Goal Cards */}
        {goals.map((g, i) => (
          <View key={i} style={s.goalCard}>
            <View style={s.goalHeader}>
              <Text style={s.goalIcon}>{g.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.goalTitle}>{g.title}</Text>
                <Text style={s.goalMeta}>{g.current} / {g.target}</Text>
              </View>
              <Text style={s.goalPercent}>{g.progress}%</Text>
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${g.progress}%` }, g.progress >= 100 && s.barComplete]} />
            </View>
          </View>
        ))}

        {/* Recent Activity */}
        {sessions.length > 0 && (
          <>
            <Text style={s.section}>Recent Activity</Text>
            {sessions.slice(0, 5).map((session, i) => (
              <View key={i} style={s.activityRow}>
                <Text style={s.activityDate}>{new Date(session.completedAt).toLocaleDateString()}</Text>
                <Text style={s.activityExercise}>{session.exercises?.[0]?.name || 'Workout'}</Text>
                <Text style={s.activityAccuracy}>{session.totalAccuracy}%</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  banner: { backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.md, padding: SPACING.xxl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.xxl },
  bannerLabel: { fontSize: FONT.sizes.xs, color: COLORS.primary, ...FONT.semibold, letterSpacing: 2 },
  bannerGoal: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.primary, marginTop: SPACING.xs },
  bannerSub: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  goalCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  goalIcon: { fontSize: 28, marginRight: SPACING.md },
  goalTitle: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.textPrimary },
  goalMeta: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  goalPercent: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.primary },
  barBg: { height: 6, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.round, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.round },
  barComplete: { backgroundColor: COLORS.success },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginTop: SPACING.xxl, marginBottom: SPACING.lg },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  activityDate: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  activityExercise: { fontSize: FONT.sizes.sm, ...FONT.semibold, color: COLORS.textPrimary },
  activityAccuracy: { fontSize: FONT.sizes.sm, ...FONT.bold, color: COLORS.primary },
});
