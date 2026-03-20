import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊', '😁', '🤩', '💪', '🔥', '⚡'];

export default function MoodCheckinScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [selectedMood, setSelectedMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.getMoodLogs().then(d => { if (Array.isArray(d)) setLogs(d); }).catch(() => {});
  }, []);

  const handleLog = async () => {
    const newRecord = { date: new Date().toISOString(), moodScore: selectedMood, energyLevel: energy, stressLevel: stress, notes };
    setLogs(prev => [newRecord, ...prev]);
    setNotes('');
    
    try {
      await api.logMood({ moodScore: selectedMood, energyLevel: energy, stressLevel: stress, notes });
    } catch (e) { console.log('Guest save skipped'); }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>🧠 WELLNESS CHECK</Text>
        <Text style={s.subtitle}>How are you feeling today?</Text>

        {/* Mood Selector */}
        <View style={s.card}>
          <Text style={s.cardLabel}>MOOD</Text>
          <View style={s.emojiRow}>
            {MOOD_EMOJIS.map((emoji, i) => (
              <TouchableOpacity key={i} style={[s.emojiBtn, selectedMood === i + 1 && s.emojiBtnActive]}
                onPress={() => setSelectedMood(i + 1)}>
                <Text style={s.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.sliderLabel}>{selectedMood}/10</Text>
        </View>

        {/* Energy Slider */}
        <View style={s.card}>
          <Text style={s.cardLabel}>ENERGY LEVEL</Text>
          <View style={s.barRow}>
            {Array.from({ length: 10 }, (_, i) => (
              <TouchableOpacity key={i} onPress={() => setEnergy(i + 1)}
                style={[s.barSegment, i < energy && { backgroundColor: COLORS.primaryContainer }]} />
            ))}
          </View>
          <Text style={s.sliderLabel}>{energy}/10</Text>
        </View>

        {/* Stress Slider */}
        <View style={s.card}>
          <Text style={s.cardLabel}>STRESS LEVEL</Text>
          <View style={s.barRow}>
            {Array.from({ length: 10 }, (_, i) => (
              <TouchableOpacity key={i} onPress={() => setStress(i + 1)}
                style={[s.barSegment, i < stress && { backgroundColor: stress > 7 ? COLORS.danger : stress > 4 ? COLORS.warning : COLORS.primaryContainer }]} />
            ))}
          </View>
          <Text style={s.sliderLabel}>{stress}/10</Text>
        </View>

        {/* Notes */}
        <View style={s.card}>
          <Text style={s.cardLabel}>NOTES</Text>
          <TextInput style={s.notesInput} value={notes} onChangeText={setNotes}
            placeholder="How's your day going?" placeholderTextColor={COLORS.textMuted}
            multiline numberOfLines={3} />
        </View>

        <TouchableOpacity style={s.logBtn} onPress={handleLog}>
          <Text style={s.logBtnText}>LOG CHECK-IN</Text>
        </TouchableOpacity>

        {/* History */}
        <Text style={s.sectionTitle}>RECENT</Text>
        {logs.slice(0, 7).map((log, idx) => (
          <View key={idx} style={s.histCard}>
            <Text style={s.histDate}>{new Date(log.date).toLocaleDateString()}</Text>
            <View style={s.histRight}>
              <Text style={{ fontSize: 18 }}>{MOOD_EMOJIS[(log.moodScore || 1) - 1]}</Text>
              <Text style={s.histEnergy}>⚡ {log.energyLevel || 0}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="MoodCheckin" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: COLORS.primaryContainer, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  cardLabel: { fontSize: FONT.sizes.xs, color: COLORS.primaryContainer, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.md },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  emojiBtn: { padding: 6, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'transparent' },
  emojiBtnActive: { borderColor: COLORS.primaryContainer, backgroundColor: COLORS.primaryContainer + '20' },
  emoji: { fontSize: 20 },
  sliderLabel: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, textAlign: 'right', marginTop: SPACING.sm },
  barRow: { flexDirection: 'row', gap: 3 },
  barSegment: { flex: 1, height: 28, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceElevated },
  notesInput: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: FONT.sizes.sm, minHeight: 60, textAlignVertical: 'top' },
  logBtn: { backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.round, padding: SPACING.xl, alignItems: 'center', marginVertical: SPACING.lg },
  logBtnText: { color: COLORS.onPrimary, fontWeight: '900', fontSize: FONT.sizes.md, letterSpacing: 1 },
  sectionTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.md },
  histCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  histDate: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  histRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  histEnergy: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
});
