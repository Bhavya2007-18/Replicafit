import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import api from '../services/api';

export default function AchievementsScreen({ navigation }) {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    api.getAchievements().then(data => {
      if (Array.isArray(data)) setAchievements(data);
    }).catch(console.log);
  }, []);

  const unlocked = achievements.filter(a => a.unlocked).length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((s, a) => s + (a.xpReward || 0), 0);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Achievements & Rewards</Text>

        <View style={s.summaryRow}>
          <View style={s.summaryBox}><Text style={s.summaryValue}>{unlocked}</Text><Text style={s.summaryLabel}>Unlocked</Text></View>
          <View style={s.summaryBox}><Text style={s.summaryValue}>{achievements.length}</Text><Text style={s.summaryLabel}>Total</Text></View>
          <View style={s.summaryBox}><Text style={s.summaryValue}>{totalXP}</Text><Text style={s.summaryLabel}>XP Earned</Text></View>
        </View>

        {achievements.map((a, i) => (
          <View key={i} style={[s.card, !a.unlocked && s.cardLocked]}>
            <View style={s.cardRow}>
              <Text style={s.cardIcon}>{a.icon || '🏅'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{a.title}</Text>
                <Text style={s.cardDesc}>{a.description}</Text>
                {a.progress && <Text style={s.cardProgress}>{a.progress.current}/{a.progress.target}</Text>}
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
