import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { exerciseDatabase as localExercises } from '../data/exerciseDatabase';
import api from '../services/api';
import BottomNavBar from '../components/BottomNavBar';

export default function ExerciseLibraryScreen({ navigation }) {
  const [exercises, setExercises] = useState(localExercises);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getExercises().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setExercises(data.map(e => ({ ...e, id: e._id || e.id })));
      }
    }).catch(() => {});
  }, []);

  const filtered = exercises.filter(ex => 
    ex.name.toLowerCase().includes(search.toLowerCase()) || 
    ex.targetMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.logo}>MOVEMENT VAULT</Text>
        <Text style={s.subText}>AI-DRIVEN BIOMECHANIC DATABASE</Text>
      </View>

      <View style={s.searchBox}>
        <TextInput 
          style={s.searchInput} 
          placeholder="SEARCH MOVEMENTS..." 
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {filtered.map((ex) => (
          <TouchableOpacity key={ex.id || ex._id} style={s.card} onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id || ex._id })}>
            <View style={s.cardBody}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>{ex.name.toUpperCase()}</Text>
                <View style={[s.diffBadge, s[`diff${ex.difficulty}`]]}>
                  <Text style={s.diffText}>{ex.difficulty.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={s.cardMuscles}>{ex.targetMuscles.join(' • ').toUpperCase()}</Text>
              
              <View style={s.cardFooter}>
                <View style={s.xpPill}>
                  <Text style={s.xpText}>+250 XP POTENTIAL</Text>
                </View>
                <Text style={s.arrow}>VIEW SPECIFICATIONS ›</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="ExerciseLibrary" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl, marginBottom: SPACING.lg },
  logo: { fontSize: FONT.sizes.xxxl, color: COLORS.textPrimary, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  subText: { fontSize: 10, color: COLORS.primaryContainer, fontWeight: '800', letterSpacing: 3, marginTop: 4 },

  searchBox: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  searchInput: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.round, 
    padding: SPACING.lg, 
    color: COLORS.textPrimary, 
    fontSize: 12, 
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
    letterSpacing: 1
  },

  scroll: { paddingHorizontal: SPACING.xl },
  card: { 
    backgroundColor: COLORS.surfaceElevated, 
    borderRadius: RADIUS.xxl, 
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden'
  },
  cardBody: { padding: SPACING.xl },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  cardTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, flex: 1, marginRight: SPACING.md },
  
  diffBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  diffBeginner: { backgroundColor: 'rgba(46, 213, 115, 0.15)' },
  diffIntermediate: { backgroundColor: 'rgba(255, 171, 0, 0.15)' },
  diffAdvanced: { backgroundColor: 'rgba(255, 71, 87, 0.15)' },
  diffText: { fontSize: 8, fontWeight: '900', color: COLORS.textPrimary },

  cardMuscles: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginBottom: SPACING.xl },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpPill: { backgroundColor: 'rgba(202, 253, 0, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.round },
  xpText: { fontSize: 8, fontWeight: '900', color: COLORS.primaryContainer, letterSpacing: 1 },
  arrow: { fontSize: 10, fontWeight: '800', color: COLORS.primaryContainer, letterSpacing: 1 },
});
