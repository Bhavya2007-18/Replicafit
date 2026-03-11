import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

export default function GoalTrackingScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Goal Tracking</Text>

        {/* Overall Progress */}
        <View style={s.progressCard}>
          <Text style={s.progressLabel}>Overall Progress</Text>
          <Text style={s.progressSub}>Active Goals</Text>
          <Text style={s.milestone}>Next milestone: 2 days</Text>
          <View style={s.barBg}><View style={[s.barFill, { width: '65%' }]} /></View>
        </View>

        <Text style={s.section}>Active Goals</Text>

        {/* Goal 1 */}
        <View style={s.goalCard}>
          <View style={s.goalRow}>
            <Text style={s.goalTitle}>Lose 8 kg</Text>
            <View style={s.badge}><Text style={s.badgeText}>In Progress</Text></View>
          </View>
          <Text style={s.goalTarget}>Target: 75 kg • Dec 31, 2023</Text>
          <View style={s.miniBar}><View style={[s.miniBarFill, { width: '40%' }]} /></View>
        </View>

        {/* Goal 2 */}
        <View style={s.goalCard}>
          <View style={s.goalRow}>
            <Text style={s.goalTitle}>Complete 100 workouts</Text>
            <View style={s.badge}><Text style={s.badgeText}>In Progress</Text></View>
          </View>
          <Text style={s.goalTarget}>Target: 100 sessions • Oct 15, 2023</Text>
          <View style={s.miniBar}><View style={[s.miniBarFill, { width: '82%' }]} /></View>
        </View>

        {/* Goal 3 - Completed */}
        <View style={[s.goalCard, s.goalDone]}>
          <View style={s.goalRow}>
            <Text style={s.goalTitle}>Drink 2L Water Daily</Text>
            <View style={s.badgeDone}><Text style={s.badgeDoneText}>Completed</Text></View>
          </View>
          <Text style={s.goalTarget}>30 Day Challenge</Text>
          <View style={s.miniBar}><View style={[s.miniBarFill, s.miniBarDone, { width: '100%' }]} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg },
  title: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl },
  progressCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.xxl },
  progressLabel: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary },
  progressSub: { fontSize: FONT.sizes.md, color: COLORS.textSecondary, marginTop: 4 },
  milestone: { fontSize: FONT.sizes.sm, color: COLORS.primary, ...FONT.semibold, marginTop: SPACING.md, marginBottom: SPACING.md },
  barBg: { height: 8, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.round, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.primary },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  goalCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  goalDone: { borderColor: COLORS.success, opacity: 0.85 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  goalTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, flex: 1 },
  badge: { backgroundColor: COLORS.primaryMuted, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md },
  badgeText: { color: COLORS.primary, fontSize: FONT.sizes.xs, ...FONT.bold, textTransform: 'uppercase' },
  badgeDone: { backgroundColor: COLORS.successMuted, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md },
  badgeDoneText: { color: COLORS.success, fontSize: FONT.sizes.xs, ...FONT.bold, textTransform: 'uppercase' },
  goalTarget: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  miniBar: { height: 6, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.round, overflow: 'hidden' },
  miniBarFill: { height: '100%', backgroundColor: COLORS.primary },
  miniBarDone: { backgroundColor: COLORS.success },
});
