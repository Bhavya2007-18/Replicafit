import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { calculateMacros } from '../services/nutritionEngine';
import { getDailyTargets, getRemainingMacros, getGuidance } from '../services/nutritionGuidanceEngine';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DietGuidelinesScreen({ navigation }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');

  const profile = user?.profile || {};
  const targets = getDailyTargets(profile);

  useEffect(() => {
    api.getNutritionLogs().then(data => {
      if (Array.isArray(data)) setLogs(data);
    }).catch(console.log);
  }, []);

  const todayLog = logs.find(l => new Date(l.date).toDateString() === new Date().toDateString());
  const todayCalories = todayLog?.totalCalories || 0;
  const todayProtein = todayLog?.totalProtein || 0;
  const todayCarbs = todayLog?.totalCarbs || 0;
  const todayFats = todayLog?.totalFats || 0;

  const guidance = getGuidance(targets, { 
    totalCalories: todayCalories, 
    totalProtein: todayProtein,
    totalCarbs: todayCarbs,
    totalFat: todayFats
  });

  const remaining = guidance.remaining;

  const logMeal = async () => {
    if (!mealName || !mealCalories) return;
    const cal = parseInt(mealCalories) || 0;
    const proteinTarget = Math.round(cal * 0.15); // Standard assumption for general logging
    const carbsTarget = Math.round(cal * 0.12);
    const fatTarget = Math.round(cal * 0.05);

    await api.logNutrition({
      meals: [{ name: mealName, calories: cal, protein: proteinTarget, carbs: carbsTarget, fats: fatTarget }],
      totalCalories: todayCalories + cal,
      totalProtein: todayProtein + proteinTarget,
      totalCarbs: todayCarbs + carbsTarget,
      totalFats: todayFats + fatTarget,
    });
    setMealName('');
    setMealCalories('');
    const updated = await api.getNutritionLogs();
    if (Array.isArray(updated)) setLogs(updated);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Nutrition Tracker</Text>

        <View style={s.macroRow}>
          <View style={s.macroCard}><Text style={s.macroValue}>{remaining.calories}</Text><Text style={s.macroLabel}>Cal Left</Text></View>
          <View style={s.macroCard}><Text style={s.macroValue}>{remaining.protein}g</Text><Text style={s.macroLabel}>Prot Left</Text></View>
          <View style={s.macroCard}><Text style={s.macroValue}>{targets.protein}g</Text><Text style={s.macroLabel}>Prot Goal</Text></View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Guidance: {guidance.insights[0]}</Text>
          <View style={s.progressRow}><Text style={s.progressLabel}>Daily Calories</Text><View style={s.barBg}><View style={[s.barFill, { width: `${Math.min(100, (todayCalories / targets.calories) * 100)}%` }]} /></View><Text style={s.progressVal}>{todayCalories} / {targets.calories} cal</Text></View>
          <View style={s.progressRow}><Text style={s.progressLabel}>Daily Protein</Text><View style={s.barBg}><View style={[s.barFill, { width: `${Math.min(100, (todayProtein / targets.protein) * 100)}%`, backgroundColor: COLORS.success }]} /></View><Text style={s.progressVal}>{todayProtein} / {targets.protein}g</Text></View>
        </View>

        {/* Log a Meal */}
        <Text style={s.section}>Log a Meal</Text>
        <TextInput style={s.input} placeholder="Meal name (e.g. Chicken Breast)" placeholderTextColor={COLORS.textMuted} value={mealName} onChangeText={setMealName} />
        <TextInput style={s.input} placeholder="Calories" placeholderTextColor={COLORS.textMuted} value={mealCalories} onChangeText={setMealCalories} keyboardType="numeric" />
        <TouchableOpacity style={s.logBtn} onPress={logMeal}>
          <Text style={s.logBtnText}>Log Meal</Text>
        </TouchableOpacity>

        {/* Multi-purpose Food Suggestions Placeholder */}
        {guidance.suggestions.length > 0 && (
          <View style={[s.card, { marginTop: -SPACING.md, paddingTop: SPACING.md }]}>
            <Text style={[s.cardTitle, { fontSize: FONT.sizes.md, marginBottom: SPACING.sm }]}>Smart Suggestions</Text>
            {guidance.suggestions.map((food, idx) => (
              <Text key={idx} style={{ color: COLORS.textSecondary, marginBottom: 4 }}>• {food.name} ({food.protein}g protein)</Text>
            ))}
          </View>
        )}

        {/* Recent Logs */}
        {todayLog?.meals?.map((m, i) => (
          <View key={i} style={s.mealRow}>
            <Text style={s.mealName}>{m.name}</Text>
            <Text style={s.mealCal}>{m.calories} cal</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl, marginTop: SPACING.lg },
  macroRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  macroCard: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  macroValue: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.primary },
  macroLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  progressRow: { marginBottom: SPACING.lg },
  progressLabel: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  barBg: { height: 6, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.round, overflow: 'hidden', marginBottom: SPACING.xs },
  barFill: { height: '100%', backgroundColor: COLORS.primary },
  progressVal: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, textAlign: 'right' },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: FONT.sizes.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  logBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginBottom: SPACING.xl },
  logBtnText: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.textOnPrimary },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  mealName: { fontSize: FONT.sizes.md, color: COLORS.textPrimary },
  mealCal: { fontSize: FONT.sizes.md, color: COLORS.primary, ...FONT.bold },
});
