import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

export default function ProgressDashboardScreen({ navigation }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(console.log);
  }, []);

  const p = progress || {};
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData = (p.weeklyData || []).map(w => w.accuracy || 0);
  while (weekData.length < 7) weekData.push(0);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Progress Analytics</Text>

        <View style={s.streakCard}>
          <Text style={s.streakValue}>{p.streak || 0}</Text>
          <Text style={s.streakLabel}>Day Streak 🔥</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Weekly AI Accuracy</Text>
          <View style={s.barChart}>
            {weekDays.map((day, i) => (
              <View key={i} style={s.barCol}>
                <View style={[s.bar, { height: weekData[i] > 0 ? (weekData[i] / 100) * 120 : 4 }, weekData[i] === 0 && s.barEmpty]} />
                <Text style={s.barLabel}>{day}</Text>
                {weekData[i] > 0 && <Text style={s.barVal}>{weekData[i]}%</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={s.statsGrid}>
          <View style={s.statCard}><Text style={s.statValue}>{p.totalWorkouts || 0}</Text><Text style={s.statLabel}>Total Workouts</Text></View>
          <View style={s.statCard}><Text style={s.statValue}>{p.avgAccuracy || 0}%</Text><Text style={s.statLabel}>Avg Accuracy</Text></View>
          <View style={s.statCard}><Text style={s.statValue}>{p.xp || 0}</Text><Text style={s.statLabel}>Total XP</Text></View>
          <View style={s.statCard}><Text style={s.statValue}>{Math.round((p.totalDuration || 0) / 60)}m</Text><Text style={s.statLabel}>Total Time</Text></View>
        </View>
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="ProgressDashboard" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl, marginTop: SPACING.lg },
  streakCard: { backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.md, padding: SPACING.xxl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.xl },
  streakValue: { fontSize: 48, ...FONT.bold, color: COLORS.primary },
  streakLabel: { fontSize: FONT.sizes.lg, ...FONT.semibold, color: COLORS.textPrimary, marginTop: SPACING.xs },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, marginBottom: SPACING.xs },
  barEmpty: { backgroundColor: COLORS.borderLight },
  barLabel: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  barVal: { fontSize: FONT.sizes.xs, color: COLORS.primary, ...FONT.bold, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: { width: '47%', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.primary },
  statLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
});
