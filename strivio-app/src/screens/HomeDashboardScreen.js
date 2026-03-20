import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Pedometer } from 'expo-sensors';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { getDailyTargets, getGuidance } from '../services/nutritionGuidanceEngine';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.7;
const STROKE_WIDTH = 12;

export default function HomeDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stepCount, setStepCount] = useState(0);
  const [progress, setProgress] = useState(null);
  const [nutritionLog, setNutritionLog] = useState(null);

  useEffect(() => {
    let sub;
    (async () => {
      const avail = await Pedometer.isAvailableAsync();
      if (avail) sub = Pedometer.watchStepCount(r => setStepCount(r.steps));
    })();
    return () => { if (sub) sub.remove(); };
  }, []);

  useEffect(() => {
    api.getProgress().then(setProgress).catch(console.log);
    api.getNutritionLogs().then(logs => {
      const today = logs.find(l => new Date(l.date).toDateString() === new Date().toDateString());
      setNutritionLog(today);
    }).catch(console.log);
  }, []);

  const displayName = user?.name?.split(' ')[0] || user?.profile?.name || 'ATHLETE';
  
  // Targets & Guidance
  const targets = getDailyTargets(user?.profile || {});
  const guidance = getGuidance(targets, {
    totalCalories: nutritionLog?.totalCalories || 0,
    totalProtein: nutritionLog?.totalProtein || 0,
    totalCarbs: nutritionLog?.totalCarbs || 0,
    totalFat: nutritionLog?.totalFats || 0
  });
  const topInsight = guidance.insights[0] || "REPLYING TO YOUR RECENT INPUT...";

  // Ring Percentages
  const stepTarget = 10000;
  const calTarget = targets.calories || 2500;
  const distTarget = 8; // km

  const stepPerc = Math.min(stepCount / stepTarget, 1);
  const calPerc = Math.min((nutritionLog?.totalCalories || 0) / calTarget, 1);
  const distPerc = Math.min((stepCount * 0.0008) / distTarget, 1);

  const renderRing = (perc, radius, color, index) => {
    const circum = 2 * Math.PI * radius;
    const offset = circum - perc * circum;
    return (
      <Circle
        key={index}
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={radius}
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={circum}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* Branding Header */}
        <View style={s.header}>
          <Text style={s.logo}>REPLICAFIT</Text>
          <View style={s.greetingRow}>
            <Text style={s.greetingText}>MORNING, {displayName.toUpperCase()}</Text>
            <View style={s.statusDot} />
          </View>
          <Text style={s.subText}>Ready for Explosive growth?</Text>
        </View>

        {/* Concentric Rings Visual */}
        <View style={s.ringsContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background Circles */}
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_SIZE / 2 - 20} stroke={COLORS.surfaceElevated} strokeWidth={STROKE_WIDTH} fill="transparent" />
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_SIZE / 2 - 45} stroke={COLORS.surfaceElevated} strokeWidth={STROKE_WIDTH} fill="transparent" />
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_SIZE / 2 - 70} stroke={COLORS.surfaceElevated} strokeWidth={STROKE_WIDTH} fill="transparent" />
            
            {/* Active Rings */}
            {renderRing(distPerc, RING_SIZE / 2 - 20, COLORS.primary, 0)}
            {renderRing(stepPerc, RING_SIZE / 2 - 45, COLORS.secondary, 1)}
            {renderRing(calPerc, RING_SIZE / 2 - 70, COLORS.primaryContainer, 2)}
          </Svg>
          
          <View style={s.ringsOverlay}>
            <Text style={s.overlayVal}>{stepCount}</Text>
            <Text style={s.overlayLabel}>STEPS</Text>
          </View>
        </View>

        {/* AI Coach Spotlight (Glassmorphism inspired) */}
        <TouchableOpacity style={s.aiSpotlight} onPress={() => navigation.navigate('AICoachChat')}>
          <View style={s.aiHeader}>
            <Text style={s.aiTitle}>AI COACH SPOTLIGHT</Text>
            <Text style={s.aiLive}>LIVE</Text>
          </View>
          <Text style={s.aiInsight}>{topInsight.toUpperCase()}</Text>
          <View style={s.aiFooter}>
            <Text style={s.aiAction}>ASK FOR ADJUSTMENT →</Text>
          </View>
        </TouchableOpacity>

        {/* Training Hub - Bento Grid */}
        <Text style={s.sectionTitle}>TRAINING HUB</Text>
        <View style={s.grid}>
          <HubCard icon="💪" label="PLANS" sub="Curated" onPress={() => navigation.navigate('WorkoutPlans')} />
          <HubCard icon="📖" label="LIBRARY" sub="Movements" onPress={() => navigation.navigate('ExerciseLibrary')} />
          <HubCard icon="🥗" label="FUEL" sub="Macros" onPress={() => navigation.navigate('DietGuidelines')} />
          <HubCard icon="🎯" label="GOALS" sub="Target" onPress={() => navigation.navigate('GoalTracking')} />
          <HubCard icon="📈" label="METRICS" sub="Analytics" onPress={() => navigation.navigate('ProgressDashboard')} />
          <HubCard icon="🏆" label="ELITE" sub="Badges" onPress={() => navigation.navigate('Achievements')} />
          <HubCard icon="📏" label="BODY" sub="Measure" onPress={() => navigation.navigate('BodyMeasurements')} />
          <HubCard icon="💤" label="SLEEP" sub="Recovery" onPress={() => navigation.navigate('SleepLogger')} />
          <HubCard icon="🧠" label="MOOD" sub="Wellness" onPress={() => navigation.navigate('MoodCheckin')} />
          <HubCard icon="💧" label="HYDRATE" sub="Water" onPress={() => navigation.navigate('Hydration')} />
          <HubCard icon="⏱️" label="FASTING" sub="Timer" onPress={() => navigation.navigate('Fasting')} />
          <HubCard icon="⚙️" label="DEVICES" sub="Sync" onPress={() => navigation.navigate('DeviceIntegrations')} />
        </View>

        {/* Start Session CTA */}
        <TouchableOpacity style={s.startBtn} onPress={() => navigation.navigate('GuidedWorkout')}>
          <Text style={s.startBtnText}>START EXPLOSIVE SESSION</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="HomeDashboard" />
    </SafeAreaView>
  );
}

function HubCard({ icon, label, sub, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress}>
      <Text style={s.cardIcon}>{icon}</Text>
      <View>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={s.cardSub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  header: { marginTop: SPACING.xxl, marginBottom: SPACING.xl },
  logo: { fontSize: FONT.sizes.xxxl, color: COLORS.primaryContainer, letterSpacing: 4, fontStyle: 'italic', fontWeight: '900' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  greetingText: { fontSize: FONT.sizes.xl, color: COLORS.textPrimary, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryContainer, marginLeft: SPACING.sm },
  subText: { fontSize: FONT.sizes.md, color: COLORS.textMuted, marginTop: 4 },
  
  ringsContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.xxl },
  ringsOverlay: { position: 'absolute', alignItems: 'center' },
  overlayVal: { fontSize: FONT.sizes.hero, color: COLORS.textPrimary, fontWeight: '900' },
  overlayLabel: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, letterSpacing: 2 },

  aiSpotlight: { 
    backgroundColor: 'rgba(26, 26, 26, 0.8)', 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.xl, 
    borderWidth: 1, 
    borderColor: COLORS.primaryContainer,
    marginBottom: SPACING.xxl,
    overflow: 'hidden'
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  aiTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
  aiLive: { fontSize: 10, color: COLORS.primaryContainer, fontWeight: '900', borderWidth: 1, borderColor: COLORS.primaryContainer, paddingHorizontal: 4, borderRadius: 4 },
  aiInsight: { fontSize: FONT.sizes.lg, color: COLORS.textPrimary, fontWeight: '600', lineHeight: 24 },
  aiFooter: { marginTop: SPACING.lg, alignItems: 'flex-end' },
  aiAction: { fontSize: FONT.sizes.xs, color: COLORS.primaryContainer, fontWeight: '700' },

  sectionTitle: { fontSize: FONT.sizes.md, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, justifyContent: 'space-between' },
  card: { 
    width: (width - SPACING.xl * 2 - SPACING.md) / 2, 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardIcon: { fontSize: 24 },
  cardLabel: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '700' },
  cardSub: { fontSize: 10, color: COLORS.textMuted },

  startBtn: { 
    backgroundColor: COLORS.primaryContainer, 
    marginTop: SPACING.xxl, 
    padding: SPACING.xl, 
    borderRadius: RADIUS.round, 
    alignItems: 'center',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  startBtnText: { color: COLORS.onPrimary, fontWeight: '900', fontSize: FONT.sizes.md, letterSpacing: 1 },
});
