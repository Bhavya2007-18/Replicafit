import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { exerciseDatabase as localExercises } from '../data/exerciseDatabase';
import api from '../services/api';

export default function ExerciseLibraryScreen({ navigation }) {
  const [exercises, setExercises] = useState(localExercises);

  useEffect(() => {
    api.getExercises().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setExercises(data.map(e => ({ ...e, id: e._id || e.id })));
      }
    }).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Exercise Library</Text>
        <Text style={s.subtitle}>Master Every Movement</Text>

        {exercises.map((ex) => (
          <TouchableOpacity key={ex.id || ex._id} style={s.card} onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id || ex._id })}>
            <View style={s.cardRow}>
              <View style={s.iconBox}><Text style={s.icon}>🏋️</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{ex.name}</Text>
                <Text style={s.cardMuscles}>{ex.targetMuscles.join(' • ')}</Text>
                <View style={s.diffRow}>
                  <View style={[s.diffBadge, ex.difficulty === 'Beginner' && s.diffEasy, ex.difficulty === 'Intermediate' && s.diffMed, ex.difficulty === 'Advanced' && s.diffHard]}>
                    <Text style={s.diffText}>{ex.difficulty}</Text>
                  </View>
                </View>
              </View>
              <Text style={s.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  title: { fontSize: FONT.sizes.xxxl, ...FONT.bold, color: COLORS.primary, marginTop: SPACING.lg },
  subtitle: { fontSize: FONT.sizes.md, color: COLORS.textSecondary, marginBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  icon: { fontSize: 24 },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  cardMuscles: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  diffRow: { flexDirection: 'row', marginTop: SPACING.xs },
  diffBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
  diffEasy: { backgroundColor: COLORS.successMuted },
  diffMed: { backgroundColor: COLORS.warningMuted },
  diffHard: { backgroundColor: COLORS.dangerMuted },
  diffText: { fontSize: FONT.sizes.xs, ...FONT.semibold, color: COLORS.textSecondary },
  arrow: { fontSize: 24, color: COLORS.textMuted },
});
