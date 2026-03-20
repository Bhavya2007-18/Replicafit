import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { getDailyTargets, getGuidance, QUICK_ADD_PRESETS } from '../services/nutritionGuidanceEngine';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

export default function DietGuidelinesScreen({ navigation }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');

  const profile = user?.profile || {};
  const targets = getDailyTargets(profile);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getNutritionLogs();
      if (Array.isArray(data)) setLogs(data);
    } catch (e) { console.log(e); }
  };

  const todayLog = logs.find(l => new Date(l.date).toDateString() === new Date().toDateString());
  const stats = {
    calories: todayLog?.totalCalories || 0,
    protein: todayLog?.totalProtein || 0,
    carbs: todayLog?.totalCarbs || 0,
    fat: todayLog?.totalFats || 0
  };

  const guidance = getGuidance(targets, stats);
  const { remaining } = guidance;

  const logMeal = async (name, cal, p, c, f) => {
    const meal = { 
      name: name || mealName, 
      calories: parseInt(cal || mealCalories) || 0,
      protein: p || Math.round((cal || mealCalories) * 0.15),
      carbs: c || Math.round((cal || mealCalories) * 0.12),
      fats: f || Math.round((cal || mealCalories) * 0.05)
    };

    setLogs(prev => {
      const todayString = new Date().toDateString();
      const existingToday = prev.find(l => new Date(l.date).toDateString() === todayString) || {
        date: new Date().toISOString(), totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0, meals: []
      };
      const updatedToday = {
        ...existingToday,
        totalCalories: existingToday.totalCalories + meal.calories,
        totalProtein: existingToday.totalProtein + meal.protein,
        totalCarbs: existingToday.totalCarbs + meal.carbs,
        totalFats: existingToday.totalFats + meal.fats,
        meals: [...(existingToday.meals || []), meal]
      };
      return [updatedToday, ...prev.filter(l => new Date(l.date).toDateString() !== todayString)];
    });

    try {
      await api.logNutrition({
        meals: [meal],
        totalCalories: stats.calories + meal.calories,
        totalProtein: stats.protein + meal.protein,
        totalCarbs: stats.carbs + meal.carbs,
        totalFats: stats.fat + meal.fats,
      });
    } catch (e) { console.log('Guest mode save skipped for meals'); }
    
    setMealName('');
    setMealCalories('');
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>FUEL PRECISION</Text>
          <Text style={s.subText}>OPTIMIZING METABOLIC OUTPUT</Text>
        </View>

        {/* Macro Rings Hero */}
        <View style={s.heroCard}>
          <View style={s.ringsRow}>
            <MacroRing label="PRO" current={stats.protein} target={targets.protein} color={COLORS.primaryContainer} />
            <MacroRing label="CHO" current={stats.carbs} target={targets.carbs} color={COLORS.secondary} />
            <MacroRing label="FAT" current={stats.fat} target={targets.fat} color="#fff" />
          </View>
          <View style={s.calCenter}>
            <Text style={s.calVal}>{remaining.calories}</Text>
            <Text style={s.calLabel}>KCAL REMAINING</Text>
          </View>
        </View>

        {/* Quick Add Bento */}
        <Text style={s.sectionTitle}>QUICK FUEL INJECTION</Text>
        <View style={s.bentoGrid}>
          {QUICK_ADD_PRESETS.map((item, i) => (
            <TouchableOpacity key={i} style={s.bentoItem} onPress={() => logMeal(item.name, item.calories, item.protein, item.carbs, item.fats)}>
              <Text style={s.bentoEmoji}>{item.emoji}</Text>
              <Text style={s.bentoName}>{item.name.toUpperCase()}</Text>
              <Text style={s.bentoSub}>{item.calories} KCAL</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual Entry Glass */}
        <View style={s.manualCard}>
          <Text style={s.manualTitle}>MANUAL OVERRIDE</Text>
          <View style={s.inputRow}>
            <TextInput style={s.input} placeholder="ENTRY NAME" placeholderTextColor={COLORS.textMuted} value={mealName} onChangeText={setMealName} />
            <TextInput style={[s.input, { width: 80 }]} placeholder="KCAL" placeholderTextColor={COLORS.textMuted} value={mealCalories} onChangeText={setMealCalories} keyboardType="numeric" />
            <TouchableOpacity style={s.addBtn} onPress={() => logMeal()}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insight Pill */}
        {guidance.insights.length > 0 && (
          <View style={s.insightPill}>
            <Text style={s.insightText}>⚡ {guidance.insights[0].toUpperCase()}</Text>
          </View>
        )}

        {/* Recent Fuel Logs */}
        <Text style={s.sectionTitle}>RECENT TRANSFERS</Text>
        {todayLog?.meals?.reverse().map((m, i) => (
          <View key={i} style={s.logItem}>
            <View>
              <Text style={s.logName}>{m.name.toUpperCase()}</Text>
              <Text style={s.logMacros}>{m.protein}P • {m.carbs}C • {m.fats}F</Text>
            </View>
            <Text style={s.logCal}>+{m.calories}</Text>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="DietGuidelines" />
    </SafeAreaView>
  );
}

function MacroRing({ label, current, target, color }) {
  const size = 80;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = Math.min(1, current / target);

  return (
    <View style={s.ringBox}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" />
        <Circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} strokeLinecap="round" fill="none" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </Svg>
      <Text style={[s.ringLabel, { color }]}>{label}</Text>
      <Text style={s.ringVal}>{current}g</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  header: { marginTop: SPACING.xxl, marginBottom: SPACING.xl },
  logo: { fontSize: FONT.sizes.xxxl, color: COLORS.textPrimary, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  subText: { fontSize: 10, color: COLORS.primaryContainer, fontWeight: '800', letterSpacing: 3, marginTop: 4 },

  heroCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    marginBottom: SPACING.xxl,
    alignItems: 'center'
  },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: SPACING.xl },
  ringBox: { alignItems: 'center' },
  ringLabel: { fontSize: 8, fontWeight: '900', marginTop: SPACING.sm, letterSpacing: 1 },
  ringVal: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  
  calCenter: { alignItems: 'center' },
  calVal: { fontSize: 42, fontWeight: '900', color: COLORS.primaryContainer },
  calLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 2 },

  sectionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 3, marginBottom: SPACING.lg },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  bentoItem: { 
    width: (width - SPACING.xl * 2 - SPACING.md * 2) / 3, 
    backgroundColor: COLORS.surfaceLight, 
    padding: SPACING.md, 
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  bentoEmoji: { fontSize: 20, marginBottom: 4 },
  bentoName: { fontSize: 8, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  bentoSub: { fontSize: 8, fontWeight: '700', color: COLORS.primaryContainer, marginTop: 2 },

  manualCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.lg, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    marginBottom: SPACING.xl 
  },
  manualTitle: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 2, marginBottom: SPACING.md },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  input: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  addBtn: { backgroundColor: COLORS.primaryContainer, width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: COLORS.background, fontSize: 24, fontWeight: '900' },

  insightPill: { 
    backgroundColor: 'rgba(202, 253, 0, 0.1)', 
    padding: SPACING.md, 
    borderRadius: RADIUS.round, 
    borderWidth: 1, 
    borderColor: COLORS.primaryContainer,
    marginBottom: SPACING.xxl 
  },
  insightText: { fontSize: 10, fontWeight: '900', color: COLORS.primaryContainer, textAlign: 'center', letterSpacing: 1 },

  logItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: COLORS.surfaceLight, 
    padding: SPACING.lg, 
    borderRadius: RADIUS.xl, 
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  logName: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary },
  logMacros: { fontSize: 8, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  logCal: { fontSize: 14, fontWeight: '900', color: COLORS.primaryContainer },
});
