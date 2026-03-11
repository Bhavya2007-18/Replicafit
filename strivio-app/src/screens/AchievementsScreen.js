import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

const achievements = [
  { title: 'First Workout', desc: 'Complete your first workout session', icon: '🎯', unlocked: true },
  { title: 'Week Warrior', desc: 'Complete 5 workouts in a week', icon: '⚡', unlocked: true },
  { title: 'Form Master', desc: 'Achieved 95%+ accuracy on any exercise', icon: '🏅', unlocked: true },
  { title: 'Iron Will', desc: 'Complete 30 consecutive workout days', icon: '🔥', unlocked: false, progress: '18/30' },
  { title: 'Community Star', desc: 'Help 10 other members with form tips', icon: '⭐', unlocked: false, progress: '3/10' },
  { title: 'Nutrition Master', desc: 'Log your meals for 30 days straight', icon: '🥗', unlocked: false, progress: '12/30' },
];

export default function AchievementsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Achievements & Rewards</Text>

        <View style={s.summaryRow}>
          <View style={s.summaryBox}>
            <Text style={s.summaryValue}>3</Text>
            <Text style={s.summaryLabel}>Unlocked</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryValue}>6</Text>
            <Text style={s.summaryLabel}>Total</Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.summaryValue}>450</Text>
            <Text style={s.summaryLabel}>XP Earned</Text>
          </View>
        </View>

        {achievements.map((a, i) => (
          <View key={i} style={[s.card, !a.unlocked && s.cardLocked]}>
            <View style={s.cardRow}>
              <Text style={s.cardIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{a.title}</Text>
                <Text style={s.cardDesc}>{a.desc}</Text>
                {!a.unlocked && a.progress && (
                  <Text style={s.cardProgress}>{a.progress}</Text>
                )}
              </View>
              {a.unlocked && <Text style={s.check}>✓</Text>}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl },
  summaryRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  summaryBox: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  summaryValue: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.primary },
  summaryLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  cardLocked: { opacity: 0.6 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 32, marginRight: SPACING.md },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  cardDesc: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardProgress: { fontSize: FONT.sizes.xs, color: COLORS.primary, ...FONT.semibold, marginTop: SPACING.xs },
  check: { fontSize: 24, color: COLORS.success, ...FONT.bold },
});
