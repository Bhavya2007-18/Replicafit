import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { calculateMacros } from '../services/nutritionEngine';

export default function DietGuidelinesScreen({ navigation }) {
  const macros = calculateMacros({ weight: 75, height: 178, age: 28, goal: 'muscle_gain' });

  const foods = [
    { name: 'Chicken Breast', cal: 165, protein: '31g', icon: '🍗' },
    { name: 'Brown Rice', cal: 216, protein: '5g', icon: '🍚' },
    { name: 'Greek Yogurt', cal: 100, protein: '17g', icon: '🥛' },
    { name: 'Eggs', cal: 155, protein: '13g', icon: '🥚' },
    { name: 'Salmon', cal: 208, protein: '20g', icon: '🐟' },
    { name: 'Sweet Potato', cal: 86, protein: '2g', icon: '🍠' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Nutrition Tracker</Text>

        {/* Macro Overview */}
        <View style={s.macroRow}>
          <View style={s.macroCard}>
            <Text style={s.macroValue}>{macros.calories}</Text>
            <Text style={s.macroLabel}>Calories</Text>
          </View>
          <View style={s.macroCard}>
            <Text style={s.macroValue}>{macros.protein}g</Text>
            <Text style={s.macroLabel}>Protein</Text>
          </View>
          <View style={s.macroCard}>
            <Text style={s.macroValue}>{macros.water}L</Text>
            <Text style={s.macroLabel}>Water</Text>
          </View>
        </View>

        {/* Daily Progress */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Today's Intake</Text>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Calories</Text>
            <View style={s.barBg}><View style={[s.barFill, { width: '65%' }]} /></View>
            <Text style={s.progressVal}>1,620 / {macros.calories}</Text>
          </View>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Protein</Text>
            <View style={s.barBg}><View style={[s.barFill, { width: '72%' }]} /></View>
            <Text style={s.progressVal}>108 / {macros.protein}g</Text>
          </View>
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Water</Text>
            <View style={s.barBg}><View style={[s.barFill, s.barFillWater, { width: '50%' }]} /></View>
            <Text style={s.progressVal}>1.5 / {macros.water}L</Text>
          </View>
        </View>

        {/* Suggested Foods */}
        <Text style={s.section}>Suggested Foods</Text>
        {foods.map((f, i) => (
          <View key={i} style={s.foodRow}>
            <Text style={s.foodIcon}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.foodName}>{f.name}</Text>
              <Text style={s.foodMeta}>{f.cal} cal • {f.protein} protein</Text>
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
  barFillWater: { backgroundColor: COLORS.info },
  progressVal: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, textAlign: 'right' },
  section: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  foodIcon: { fontSize: 28, marginRight: SPACING.md },
  foodName: { fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textPrimary },
  foodMeta: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
});
