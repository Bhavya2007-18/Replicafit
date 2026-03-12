import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const goals = ['fat_loss', 'muscle_gain', 'endurance', 'strength', 'mobility'];
const levels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

export default function OnboardingScreen({ navigation }) {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ age: '', height: '', weight: '', goal: 'muscle_gain', activityLevel: 'moderate', equipment: ['bodyweight'] });

  const handleFinish = async () => {
    const updates = {
      profile: {
        age: parseInt(profile.age) || 25,
        height: parseInt(profile.height) || 170,
        weight: parseInt(profile.weight) || 70,
        goal: profile.goal,
        activityLevel: profile.activityLevel,
        equipment: profile.equipment,
      },
      onboardingComplete: true,
    };
    await api.updateProfile(updates);
    updateUser(updates);
    navigation.reset({ index: 0, routes: [{ name: 'HomeDashboard' }] });
  };

  const steps = [
    // Step 0: Body metrics
    <View key="metrics">
      <Text style={s.stepTitle}>Your Body Metrics</Text>
      <Text style={s.label}>Age</Text>
      <TextInput style={s.input} placeholder="25" placeholderTextColor={COLORS.textMuted} value={profile.age} onChangeText={v => setProfile({ ...profile, age: v })} keyboardType="numeric" />
      <Text style={s.label}>Height (cm)</Text>
      <TextInput style={s.input} placeholder="170" placeholderTextColor={COLORS.textMuted} value={profile.height} onChangeText={v => setProfile({ ...profile, height: v })} keyboardType="numeric" />
      <Text style={s.label}>Weight (kg)</Text>
      <TextInput style={s.input} placeholder="70" placeholderTextColor={COLORS.textMuted} value={profile.weight} onChangeText={v => setProfile({ ...profile, weight: v })} keyboardType="numeric" />
    </View>,
    // Step 1: Goal
    <View key="goal">
      <Text style={s.stepTitle}>Your Fitness Goal</Text>
      {goals.map(g => (
        <TouchableOpacity key={g} style={[s.optionCard, profile.goal === g && s.optionCardActive]} onPress={() => setProfile({ ...profile, goal: g })}>
          <Text style={[s.optionText, profile.goal === g && s.optionTextActive]}>{g.replace('_', ' ').toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>,
    // Step 2: Activity Level
    <View key="activity">
      <Text style={s.stepTitle}>Activity Level</Text>
      {levels.map(l => (
        <TouchableOpacity key={l} style={[s.optionCard, profile.activityLevel === l && s.optionCardActive]} onPress={() => setProfile({ ...profile, activityLevel: l })}>
          <Text style={[s.optionText, profile.activityLevel === l && s.optionTextActive]}>{l.replace('_', ' ').toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>,
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Setup Your Profile</Text>
        <Text style={s.progress}>Step {step + 1} of {steps.length}</Text>
        <View style={s.progressBar}><View style={[s.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} /></View>

        {steps[step]}

        <View style={s.btnRow}>
          {step > 0 && <TouchableOpacity style={s.backBtn} onPress={() => setStep(step - 1)}><Text style={s.backBtnText}>Back</Text></TouchableOpacity>}
          <TouchableOpacity style={s.nextBtn} onPress={() => step < steps.length - 1 ? setStep(step + 1) : handleFinish()}>
            <Text style={s.nextBtnText}>{step < steps.length - 1 ? 'Next' : 'Finish'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  title: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.primary, marginTop: SPACING.lg },
  progress: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.md },
  progressBar: { height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, marginBottom: SPACING.xxl },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  stepTitle: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  label: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, ...FONT.semibold, marginBottom: SPACING.xs, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  optionCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  optionCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  optionText: { fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.primary },
  btnRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xxl },
  backBtn: { flex: 1, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  backBtnText: { fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textSecondary },
  nextBtn: { flex: 2, backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center' },
  nextBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
});
