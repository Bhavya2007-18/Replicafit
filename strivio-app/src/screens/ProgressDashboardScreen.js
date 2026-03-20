import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function ProgressDashboardScreen({ navigation }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(console.log);
  }, []);

  const p = progress || {};
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const weekData = (p.weeklyData || []).map(w => w.accuracy || 0);
  while (weekData.length < 7) weekData.push(0);

  // XP Progress Logic
  const xp = p.xp || 1250;
  const level = Math.floor(xp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const prevLevelXp = (level - 1) * 1000;
  const xpProgress = (xp - prevLevelXp) / (nextLevelXp - prevLevelXp);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>ANALYSIS HQ</Text>
          <Text style={s.subText}>UNMATCHED PROGRESS DETECTED</Text>
        </View>

        {/* XP Progress Hero */}
        <View style={s.xpCard}>
          <View style={s.xpHeader}>
            <Text style={s.xpLevel}>LEVEL {level}</Text>
            <Text style={s.xpVal}>{xp} / {nextLevelXp} XP</Text>
          </View>
          <View style={s.xpTrack}>
            <View style={[s.xpFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={s.xpTarget}>CORE ASCENSION: {Math.round((1 - xpProgress) * 100)}% REMAINING</Text>
        </View>

        {/* Main Bar Chart */}
        <View style={s.chartCard}>
          <Text style={s.cardTitle}>WEEKLY FORM ACCURACY</Text>
          <View style={s.barChart}>
            {weekDays.map((day, i) => (
              <View key={i} style={s.barCol}>
                <View style={[s.bar, { height: Math.max(4, (weekData[i] / 100) * 140) }, weekData[i] >= 80 && s.barNeon]} />
                <Text style={s.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid - ReplicaFit Bento Style */}
        <Text style={s.sectionTitle}>CORE METRICS</Text>
        <View style={s.grid}>
          <MetricCard label="STREAK" val={`${p.streak || 0}d`} sub="EXPLOSIVE" color={COLORS.secondary} />
          <MetricCard label="AVG FORM" val={`${p.avgAccuracy || 0}%`} sub="PRECISION" color={COLORS.primaryContainer} />
          <MetricCard label="WORKOUTS" val={p.totalWorkouts || 0} sub="COMPLETED" />
          <MetricCard label="REPS" val={p.totalReps || 0} sub="DYNAMIC" />
          <MetricCard label="CALORIES" val={Math.round(p.totalCalories || 0)} sub="ENERGY" />
          <MetricCard label="TIME" val={`${Math.round((p.totalDuration || 0) / 60)}m`} sub="ENGAGEMENT" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="ProgressDashboard" />
    </SafeAreaView>
  );
}

function MetricCard({ label, val, sub, color = '#fff' }) {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={[s.metricVal, { color }]}>{val}</Text>
      <Text style={s.metricSub}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  header: { marginTop: SPACING.xxl, marginBottom: SPACING.xl },
  logo: { fontSize: FONT.sizes.xxxl, color: COLORS.textPrimary, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  subText: { fontSize: 10, color: COLORS.primaryContainer, fontWeight: '800', letterSpacing: 3, marginTop: 4 },

  xpCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    marginBottom: SPACING.xxl 
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.md },
  xpLevel: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  xpVal: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  xpTrack: { height: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: COLORS.primaryContainer },
  xpTarget: { fontSize: 8, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginTop: SPACING.md, textAlign: 'center' },

  chartCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    marginBottom: SPACING.xxl 
  },
  cardTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 2, marginBottom: SPACING.xxxl },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 12, backgroundColor: COLORS.surfaceElevated, borderRadius: 6, marginBottom: SPACING.sm },
  barNeon: { backgroundColor: COLORS.primaryContainer },
  barLabel: { fontSize: 8, color: COLORS.textMuted, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 3, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, justifyContent: 'space-between' },
  metricCard: { 
    width: (width - SPACING.xl * 2 - SPACING.md) / 2, 
    backgroundColor: COLORS.surfaceLight, 
    padding: SPACING.xl, 
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  metricLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  metricVal: { fontSize: 24, fontWeight: '900', marginVertical: 4 },
  metricSub: { fontSize: 8, fontWeight: '800', color: COLORS.primaryContainer, letterSpacing: 1 },
});
