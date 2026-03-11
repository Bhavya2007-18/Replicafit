import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

export default function GuidedWorkoutScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Guided Workout</Text>

        {/* Camera Placeholder */}
        <View style={s.cameraBox}>
          <Text style={s.cameraIcon}>📸</Text>
          <Text style={s.cameraText}>AI Camera Feed</Text>
          <Text style={s.cameraSub}>Position yourself in frame to begin</Text>
        </View>

        {/* Live Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>0</Text>
            <Text style={s.statLabel}>Reps</Text>
          </View>
          <View style={[s.statBox, s.statBoxAccent]}>
            <Text style={s.statValueAccent}>--</Text>
            <Text style={s.statLabelAccent}>Accuracy</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>00:00</Text>
            <Text style={s.statLabel}>Time</Text>
          </View>
        </View>

        {/* AI Feedback */}
        <View style={s.feedbackCard}>
          <Text style={s.feedbackTitle}>AI Feedback</Text>
          <Text style={s.feedbackText}>Waiting for movement detection...</Text>
        </View>

        {/* Controls */}
        <TouchableOpacity style={s.startBtn}>
          <Text style={s.startBtnText}>Start Workout</Text>
        </TouchableOpacity>

        <View style={s.controlRow}>
          <TouchableOpacity style={s.controlBtn}>
            <Text style={s.controlText}>⏸ Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.controlBtn, s.controlBtnDanger]}>
            <Text style={[s.controlText, s.controlTextDanger]}>⏹ Stop</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  cameraBox: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, height: 280, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', marginBottom: SPACING.xl },
  cameraIcon: { fontSize: 48, marginBottom: SPACING.md },
  cameraText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  cameraSub: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  statBox: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statBoxAccent: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  statValue: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary },
  statValueAccent: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.primary },
  statLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  statLabelAccent: { fontSize: FONT.sizes.xs, color: COLORS.primary, marginTop: 4 },
  feedbackCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  feedbackTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  feedbackText: { fontSize: FONT.sizes.md, color: COLORS.textSecondary },
  startBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.lg },
  startBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
  controlRow: { flexDirection: 'row', gap: SPACING.md },
  controlBtn: { flex: 1, backgroundColor: COLORS.surfaceLight, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  controlBtnDanger: { borderColor: COLORS.danger },
  controlText: { fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textPrimary },
  controlTextDanger: { color: COLORS.danger },
});
