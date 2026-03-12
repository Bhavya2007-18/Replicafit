import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { defineWorkoutPlan } from '../services/workoutEngine';
import { adaptWorkoutPlan } from '../services/adaptiveEngine';

const PLAN_TYPES = [
  { id: 'fat_loss', title: 'Fat Loss', icon: '🔥', desc: 'High intensity, calorie burn focus', color: '#ff6b6b' },
  { id: 'muscle_gain', title: 'Hypertrophy', icon: '💪', desc: 'Muscle building, progressive overload', color: '#4ecdc4' },
  { id: 'endurance', title: 'Endurance', icon: '🏃', desc: 'Stamina and cardiovascular fitness', color: '#45b7d1' },
  { id: 'strength', title: 'Strength', icon: '🏋️', desc: 'Max power, compound movements', color: '#f9ca24' },
];

export default function WorkoutPlansScreen({ navigation }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [adaptiveNotes, setAdaptiveNotes] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getWorkoutPlans();
      if (Array.isArray(data)) setPlans(data);

      // Load adaptive recommendations
      const progress = await api.getProgress();
      const sessions = await api.getWorkoutSessions();
      if (progress && Array.isArray(sessions)) {
        const adaptation = adaptWorkoutPlan(progress, sessions.slice(0, 7));
        setAdaptiveNotes(adaptation.adjustments);
      }
    } catch (e) { }
    setLoading(false);
  };

  const generatePlan = async (goalId) => {
    setGenerating(true);
    try {
      const profile = user?.profile || {};
      const plan = defineWorkoutPlan({ goal: goalId, experienceLevel: profile.activityLevel === 'active' ? 'Intermediate' : 'Beginner' });

      const newPlan = {
        title: `${PLAN_TYPES.find(p => p.id === goalId)?.title || goalId} Plan`,
        goal: goalId,
        experienceLevel: profile.activityLevel || 'moderate',
        days: [
          { dayNumber: 1, dayName: 'Day 1 — Upper Body', exercises: plan.day1, isRestDay: false },
          { dayNumber: 2, dayName: 'Day 2 — Lower Body', exercises: plan.day2, isRestDay: false },
          { dayNumber: 3, dayName: 'Day 3 — Rest', exercises: [], isRestDay: true },
          { dayNumber: 4, dayName: 'Day 4 — Upper Body', exercises: plan.day1, isRestDay: false },
          { dayNumber: 5, dayName: 'Day 5 — Lower Body', exercises: plan.day2, isRestDay: false },
          { dayNumber: 6, dayName: 'Day 6 — Active Recovery', exercises: [], isRestDay: true },
          { dayNumber: 7, dayName: 'Day 7 — Rest', exercises: [], isRestDay: true },
        ],
      };

      await api.createWorkoutPlan(newPlan);
      await loadPlans();
    } catch (e) { }
    setGenerating(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Workout Plans</Text>

        {/* Adaptive Notes */}
        {adaptiveNotes.length > 0 && (
          <View style={s.adaptiveCard}>
            <Text style={s.adaptiveTitle}>🤖 AI Recommendations</Text>
            {adaptiveNotes.map((note, i) => (
              <Text key={i} style={s.adaptiveText}>• {note}</Text>
            ))}
          </View>
        )}

        {/* Plan Generator */}
        <Text style={s.section}>Generate New Plan</Text>
        <View style={s.planGrid}>
          {PLAN_TYPES.map(p => (
            <TouchableOpacity key={p.id} style={s.planCard} onPress={() => generatePlan(p.id)} disabled={generating}>
              <Text style={s.planIcon}>{p.icon}</Text>
              <Text style={s.planTitle}>{p.title}</Text>
              <Text style={s.planDesc}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {generating && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />}

        {/* Saved Plans */}
        {plans.length > 0 && <Text style={s.section}>Your Plans</Text>}
        {plans.map((plan, i) => (
          <View key={i} style={s.savedPlan}>
            <View style={s.savedHeader}>
              <Text style={s.savedTitle}>{plan.title}</Text>
              <Text style={s.savedDate}>{new Date(plan.createdAt).toLocaleDateString()}</Text>
            </View>
            {plan.days?.filter(d => !d.isRestDay).slice(0, 2).map((day, j) => (
              <View key={j} style={s.dayRow}>
                <Text style={s.dayName}>{day.dayName}</Text>
                <Text style={s.dayExercises}>{day.exercises?.length || 0} exercises</Text>
              </View>
            ))}
            <TouchableOpacity style={s.startPlanBtn} onPress={() => navigation.navigate('GuidedWorkout')}>
              <Text style={s.startPlanText}>Start This Plan</Text>
            </TouchableOpacity>
          </View>
        ))}

        {loading && <ActivityIndicator size="large" color={COLORS.primary} />}
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="WorkoutPlans" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl, marginTop: SPACING.lg },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg, marginTop: SPACING.lg },
  adaptiveCard: { backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.xl },
  adaptiveTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.primary, marginBottom: SPACING.md },
  adaptiveText: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, marginBottom: SPACING.xs, lineHeight: 20 },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  planCard: { width: '47%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  planIcon: { fontSize: 28, marginBottom: SPACING.sm },
  planTitle: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.textPrimary },
  planDesc: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  savedPlan: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  savedHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  savedTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.primary },
  savedDate: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  dayName: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary },
  dayExercises: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary },
  startPlanBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.md },
  startPlanText: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.textOnPrimary },
});
