import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { exerciseDatabase as exercises } from '../data/exerciseDatabase';

const { width } = Dimensions.get('window');

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exerciseId, exercise: passedExercise } = route.params;
  const ex = passedExercise || exercises.find(e => e.id === exerciseId || e._id === exerciseId);
  
  if (!ex) return (
    <SafeAreaView style={s.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
        <Text style={{ color: '#f5f5f5', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>EXERCISE NOT FOUND</Text>
        <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 24 }}>This exercise could not be loaded.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#cafd00', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }}>
          <Text style={{ color: '#0a0a0a', fontWeight: '900', fontSize: 12 }}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* Header Navigation */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>‹ BACK TO VAULT</Text>
        </TouchableOpacity>

        {/* Hero Section */}
        <View style={s.hero}>
          <Text style={s.title}>{ex.name.toUpperCase()}</Text>
          <View style={s.metaRow}>
            <View style={[s.badge, s[`badge${ex.difficulty}`]]}>
              <Text style={s.badgeText}>{ex.difficulty.toUpperCase()}</Text>
            </View>
            <View style={s.xpPill}>
              <Text style={s.xpText}>+250 XP</Text>
            </View>
          </View>
        </View>

        {/* Muscle Groups */}
        <Text style={s.sectionHeader}>PRIMARY TARGETS</Text>
        <View style={s.chipRow}>
          {ex.targetMuscles.map((m, i) => (
            <View key={i} style={s.chip}>
              <Text style={s.chipText}>{m.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <Text style={s.sectionHeader}>EXECUTION PROTOCOL</Text>
        {ex.instructions.map((step, i) => (
          <View key={i} style={s.stepCard}>
            <View style={s.stepHeader}>
              <View style={s.stepDot} />
              <Text style={s.stepTitle}>PHASE {i + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}

        {/* Common Mistakes */}
        <Text style={s.sectionHeader}>BIOMECHANIC WARNINGS</Text>
        {ex.commonMistakes.map((m, i) => (
          <View key={i} style={s.mistakeCard}>
            <Text style={s.mistakeIcon}>⚡</Text>
            <Text style={s.mistakeText}>{m.toUpperCase()}</Text>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Footer */}
      <View style={s.footer}>
        <TouchableOpacity style={s.startBtn} onPress={() => navigation.navigate('GuidedWorkout')}>
          <Text style={s.startBtnText}>INITIALIZE AI TRAINING</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  
  backBtn: { marginTop: SPACING.xl, marginBottom: SPACING.xl },
  backText: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 2 },

  hero: { marginBottom: SPACING.xxl },
  title: { fontSize: 32, fontWeight: '900', fontStyle: 'italic', color: COLORS.textPrimary, letterSpacing: 2, marginBottom: SPACING.md },
  metaRow: { flexDirection: 'row', gap: SPACING.md },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  badgeBeginner: { backgroundColor: 'rgba(46, 213, 115, 0.15)' },
  badgeIntermediate: { backgroundColor: 'rgba(255, 171, 0, 0.15)' },
  badgeAdvanced: { backgroundColor: 'rgba(255, 71, 87, 0.15)' },
  badgeText: { fontSize: 8, fontWeight: '900', color: COLORS.textPrimary },
  xpPill: { backgroundColor: 'rgba(202, 253, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round },
  xpText: { fontSize: 8, fontWeight: '900', color: COLORS.primaryContainer, letterSpacing: 1 },

  sectionHeader: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 3, marginBottom: SPACING.lg, marginTop: SPACING.xxl },
  
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderBottomWidth: 2, borderBottomColor: COLORS.primaryContainer, paddingRight: SPACING.md, paddingVertical: 4 },
  chipText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  stepCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    padding: SPACING.lg, 
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryContainer
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryContainer, marginRight: 8 },
  stepTitle: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1 },
  stepText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 22 },

  mistakeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 71, 87, 0.05)', 
    padding: SPACING.lg, 
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
    marginBottom: SPACING.sm
  },
  mistakeIcon: { fontSize: 16, color: '#ff4757', marginRight: SPACING.md },
  mistakeText: { flex: 1, fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.5 },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: SPACING.xl,
    backgroundColor: 'rgba(14, 14, 14, 0.8)' 
  },
  startBtn: { 
    backgroundColor: COLORS.primaryContainer, 
    paddingVertical: SPACING.xl, 
    borderRadius: RADIUS.round, 
    alignItems: 'center',
    elevation: 20,
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 0.4,
    shadowRadius: 20
  },
  startBtnText: { fontSize: 14, fontWeight: '900', color: COLORS.background, letterSpacing: 1 },
});
