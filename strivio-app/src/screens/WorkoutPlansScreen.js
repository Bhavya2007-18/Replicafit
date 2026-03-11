import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

const plans = [
  { id: 'fat_loss', title: 'Fat Loss Protocol', desc: 'High-intensity cardio and metabolic conditioning designed to torch calories and improve heart health.', icon: '🔥', sessions: '5x/week', duration: '45 min' },
  { id: 'muscle', title: 'Muscle Hypertrophy', desc: 'Focused volume training and progressive overload to maximize muscle fiber growth and definition.', icon: '💪', sessions: '4x/week', duration: '60 min' },
  { id: 'strength', title: 'Absolute Strength', desc: 'Low-rep, heavy-load compound movements designed for powerlifters and strength enthusiasts.', icon: '🏋️', sessions: '4x/week', duration: '75 min' },
  { id: 'mobility', title: 'Total Flow Mobility', desc: 'Restore range of motion and joint health through dynamic stretching and stability exercises.', icon: '🧘', sessions: '3x/week', duration: '30 min' },
];

export default function WorkoutPlansScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>Strivio Plans</Text>
          <Text style={s.subtitle}>Evolve Your Body</Text>
          <Text style={s.desc}>Choose a path to master your physical potential.</Text>
        </View>

        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[s.planCard, selected === plan.id && s.planCardSelected]}
            onPress={() => setSelected(plan.id)}
          >
            <View style={s.planHeader}>
              <Text style={s.planIcon}>{plan.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.planTitle}>{plan.title}</Text>
                <View style={s.planMeta}>
                  <Text style={s.planMetaText}>{plan.sessions}</Text>
                  <Text style={s.planMetaDot}>•</Text>
                  <Text style={s.planMetaText}>{plan.duration}</Text>
                </View>
              </View>
              {selected === plan.id && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.planDesc}>{plan.desc}</Text>
          </TouchableOpacity>
        ))}

        {selected && (
          <TouchableOpacity style={s.startBtn} onPress={() => navigation.navigate('GuidedWorkout')}>
            <Text style={s.startBtnText}>Start This Plan</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  header: { marginBottom: SPACING.xxl, paddingTop: SPACING.lg },
  title: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.primary },
  subtitle: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginTop: SPACING.sm },
  desc: { fontSize: FONT.sizes.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  planCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  planCardSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  planIcon: { fontSize: 32, marginRight: SPACING.md },
  planTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  planMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  planMetaText: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary },
  planMetaDot: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginHorizontal: 6 },
  planDesc: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  checkmark: { fontSize: 24, color: COLORS.primary, ...FONT.bold },
  startBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.lg },
  startBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
});
