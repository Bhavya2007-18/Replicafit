import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useState, useEffect } from 'react';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';

export default function HomeDashboardScreen({ navigation }) {
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    let subscription;
    const subscribe = async () => {
      const avail = await Pedometer.isAvailableAsync();
      if (avail) subscription = Pedometer.watchStepCount(r => setStepCount(r.steps));
    };
    subscribe();
    return () => { if (subscription) subscription.remove(); };
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>Strivio</Text>
          <Text style={s.greeting}>Morning, Alex</Text>
          <Text style={s.sub}>Your fitness summary for today</Text>
        </View>

        {/* Daily Activity Card */}
        <View style={s.activityCard}>
          <Text style={s.activityLabel}>Daily Activity</Text>
          <View style={s.activityRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{stepCount}</Text>
              <Text style={s.statLabel}>Steps</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{Math.floor(stepCount * 0.04)}</Text>
              <Text style={s.statLabel}>Calories</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{Math.floor(stepCount * 0.0008 * 10) / 10}</Text>
              <Text style={s.statLabel}>km</Text>
            </View>
          </View>
        </View>

        {/* Weekly Goal */}
        <View style={s.weeklyCard}>
          <Text style={s.cardTitle}>Weekly Goal</Text>
          <Text style={s.weeklyProgress}>4 of 5 Workouts</Text>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: '80%' }]} />
          </View>
        </View>

        {/* AI Form Accuracy */}
        <View style={s.aiCard}>
          <Text style={s.cardTitle}>AI Form Accuracy</Text>
          <View style={s.exerciseRow}>
            <View style={s.exerciseItem}>
              <Text style={s.exerciseName}>Squats</Text>
              <Text style={s.exerciseScore}>92%</Text>
              <Text style={s.exerciseSub}>Last Session</Text>
            </View>
            <View style={s.exerciseItem}>
              <Text style={s.exerciseName}>Pushups</Text>
              <Text style={s.exerciseScore}>87%</Text>
              <Text style={s.exerciseSub}>Last Session</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('GuidedWorkout')}>
          <Text style={s.primaryBtnText}>Start Guided Workout</Text>
        </TouchableOpacity>

        <View style={s.gridRow}>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('WorkoutPlans')}>
            <Text style={s.gridIcon}>💪</Text>
            <Text style={s.gridLabel}>Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('ExerciseLibrary')}>
            <Text style={s.gridIcon}>📖</Text>
            <Text style={s.gridLabel}>Exercises</Text>
          </TouchableOpacity>
        </View>
        <View style={s.gridRow}>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('GoalTracking')}>
            <Text style={s.gridIcon}>🎯</Text>
            <Text style={s.gridLabel}>Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('DietGuidelines')}>
            <Text style={s.gridIcon}>🥗</Text>
            <Text style={s.gridLabel}>Nutrition</Text>
          </TouchableOpacity>
        </View>
        <View style={s.gridRow}>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('ProgressDashboard')}>
            <Text style={s.gridIcon}>📈</Text>
            <Text style={s.gridLabel}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('AICoachChat')}>
            <Text style={s.gridIcon}>🤖</Text>
            <Text style={s.gridLabel}>AI Coach</Text>
          </TouchableOpacity>
        </View>
        <View style={s.gridRow}>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('Achievements')}>
            <Text style={s.gridIcon}>🏆</Text>
            <Text style={s.gridLabel}>Achievements</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.gridCard} onPress={() => navigation.navigate('Community')}>
            <Text style={s.gridIcon}>👥</Text>
            <Text style={s.gridLabel}>Community</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="HomeDashboard" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  header: { paddingTop: SPACING.xxl, marginBottom: SPACING.xl },
  logo: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.primary, marginBottom: SPACING.xs },
  greeting: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary },
  sub: { fontSize: FONT.sizes.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  activityCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  activityLabel: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, ...FONT.semibold, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 1 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.primary },
  statLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  weeklyCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  weeklyProgress: { fontSize: FONT.sizes.md, color: COLORS.primary, ...FONT.semibold, marginBottom: SPACING.md },
  progressBg: { height: 6, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.round, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.round },
  aiCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  exerciseItem: { alignItems: 'center', flex: 1 },
  exerciseName: { fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textPrimary, marginBottom: 4 },
  exerciseScore: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.success },
  exerciseSub: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  primaryBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.xl },
  primaryBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
  gridRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  gridCard: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  gridIcon: { fontSize: 28, marginBottom: SPACING.sm },
  gridLabel: { fontSize: FONT.sizes.sm, ...FONT.semibold, color: COLORS.textPrimary },
});
