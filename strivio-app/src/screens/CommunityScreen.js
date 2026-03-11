import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

const challenges = [
  { title: '30-Day Plank Challenge', members: '2.4k', daysLeft: 12, icon: '💪', progress: 60 },
  { title: 'Squad Push-up Marathon', members: '890', daysLeft: 5, icon: '🏆', progress: 78 },
  { title: 'Flexibility February', members: '1.1k', daysLeft: 18, icon: '🧘', progress: 35 },
];

const leaderboard = [
  { name: 'Sarah K.', score: 2450, rank: 1 },
  { name: 'Mike R.', score: 2380, rank: 2 },
  { name: 'You', score: 2100, rank: 3, isUser: true },
];

export default function CommunityScreen({ navigation }) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Community Challenges</Text>

        {challenges.map((c, i) => (
          <View key={i} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>{c.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{c.title}</Text>
                <Text style={s.cardMeta}>{c.members} members • {c.daysLeft} days left</Text>
              </View>
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${c.progress}%` }]} />
            </View>
            <Text style={s.barLabel}>{c.progress}% complete</Text>
          </View>
        ))}

        <Text style={s.section}>Leaderboard</Text>
        {leaderboard.map((l, i) => (
          <View key={i} style={[s.lbRow, l.isUser && s.lbRowActive]}>
            <Text style={s.lbRank}>#{l.rank}</Text>
            <Text style={[s.lbName, l.isUser && s.lbNameActive]}>{l.name}</Text>
            <Text style={s.lbScore}>{l.score} XP</Text>
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
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardIcon: { fontSize: 32, marginRight: SPACING.md },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  cardMeta: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  barBg: { height: 6, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.round, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.primary },
  barLabel: { fontSize: FONT.sizes.xs, color: COLORS.primary, marginTop: SPACING.xs, textAlign: 'right' },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg, marginTop: SPACING.lg },
  lbRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  lbRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  lbRank: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.primary, width: 40 },
  lbName: { flex: 1, fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textPrimary },
  lbNameActive: { color: COLORS.primary },
  lbScore: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, ...FONT.semibold },
});
