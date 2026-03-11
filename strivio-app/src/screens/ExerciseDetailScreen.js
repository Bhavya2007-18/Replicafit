import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { exerciseDatabase as exercises } from '../data/exerciseDatabase';

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exerciseId } = route.params;
  const ex = exercises.find(e => e.id === exerciseId);
  if (!ex) return null;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>{ex.name}</Text>

        <View style={s.metaRow}>
          <View style={[s.badge, ex.difficulty === 'Beginner' && s.badgeEasy, ex.difficulty === 'Intermediate' && s.badgeMed, ex.difficulty === 'Advanced' && s.badgeHard]}>
            <Text style={s.badgeText}>{ex.difficulty}</Text>
          </View>
        </View>

        <Text style={s.section}>Target Muscles</Text>
        <View style={s.chipRow}>
          {ex.targetMuscles.map((m, i) => (
            <View key={i} style={s.chip}><Text style={s.chipText}>{m}</Text></View>
          ))}
        </View>

        <Text style={s.section}>Instructions</Text>
        {ex.instructions.map((step, i) => (
          <View key={i} style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}

        <Text style={s.section}>Common Mistakes</Text>
        {ex.commonMistakes.map((m, i) => (
          <View key={i} style={s.mistakeRow}>
            <Text style={s.mistakeIcon}>⚠️</Text>
            <Text style={s.mistakeText}>{m}</Text>
          </View>
        ))}

        <TouchableOpacity style={s.startBtn} onPress={() => navigation.navigate('GuidedWorkout')}>
          <Text style={s.startBtnText}>Start Exercise with AI Coach</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg },
  title: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  metaRow: { flexDirection: 'row', marginBottom: SPACING.xxl },
  badge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md },
  badgeEasy: { backgroundColor: COLORS.successMuted },
  badgeMed: { backgroundColor: COLORS.warningMuted },
  badgeHard: { backgroundColor: COLORS.dangerMuted },
  badgeText: { fontSize: FONT.sizes.sm, ...FONT.bold, color: COLORS.textPrimary },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { backgroundColor: COLORS.primaryMuted, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round },
  chipText: { color: COLORS.primary, fontSize: FONT.sizes.sm, ...FONT.semibold },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  stepNumText: { color: COLORS.textOnPrimary, fontSize: FONT.sizes.sm, ...FONT.bold },
  stepText: { flex: 1, fontSize: FONT.sizes.md, color: COLORS.textSecondary, lineHeight: 22 },
  mistakeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md, backgroundColor: COLORS.dangerMuted, padding: SPACING.md, borderRadius: RADIUS.md },
  mistakeIcon: { fontSize: 16, marginRight: SPACING.sm },
  mistakeText: { flex: 1, fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  startBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xxl },
  startBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
});
