import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function FastingScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [activeFast, setActiveFast] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    api.getFastingLogs().then(data => {
      if (Array.isArray(data)) {
        setLogs(data);
        const ongoing = data.find(l => l.status === 'ongoing');
        if (ongoing) setActiveFast(ongoing);
      }
    }).catch(() => {});
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (activeFast) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(activeFast.startTime).getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeFast]);

  const startFast = async (hours) => {
    const newFast = { _id: Date.now().toString(), startTime: new Date().toISOString(), targetDurationHours: hours, status: 'ongoing' };
    setActiveFast(newFast);
    setLogs(prev => [newFast, ...prev]);
    try {
      await api.startFasting(hours);
    } catch (e) { console.log('Guest save skipped'); }
  };

  const endFast = async () => {
    if (!activeFast) return;
    const endedFast = { ...activeFast, endTime: new Date().toISOString(), status: 'completed' };
    setActiveFast(null);
    setLogs(prev => prev.map(l => l._id === activeFast._id ? endedFast : l));
    try {
      await api.endFasting(activeFast._id);
    } catch (e) { console.log('Guest save skipped'); }
  };

  const formatTime = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const targetSecs = activeFast ? activeFast.targetDurationHours * 3600 : 0;
  const progress = targetSecs > 0 ? Math.min(elapsed / targetSecs, 1) : 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>⏱️ FASTING</Text>
        <Text style={s.subtitle}>Intermittent fasting tracker</Text>

        {activeFast ? (
          <View style={s.activeCard}>
            <Text style={s.activeLabel}>FASTING IN PROGRESS</Text>
            <Text style={s.timer}>{formatTime(elapsed)}</Text>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={s.progressText}>{Math.round(progress * 100)}% of {activeFast.targetDurationHours}h goal</Text>
            <TouchableOpacity style={s.endBtn} onPress={endFast}>
              <Text style={s.endBtnText}>END FAST</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.startSection}>
            <Text style={s.sectionTitle}>START A FAST</Text>
            <View style={s.optionsRow}>
              {[{ hours: 12, label: '12:12' }, { hours: 16, label: '16:8' }, { hours: 18, label: '18:6' }, { hours: 20, label: '20:4' }].map(opt => (
                <TouchableOpacity key={opt.hours} style={s.optCard} onPress={() => startFast(opt.hours)}>
                  <Text style={s.optLabel}>{opt.label}</Text>
                  <Text style={s.optHours}>{opt.hours}h fast</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* History */}
        <Text style={s.sectionTitle}>HISTORY</Text>
        {logs.filter(l => l.status !== 'ongoing').slice(0, 10).map((log, idx) => {
          const durationH = log.endTime ? ((new Date(log.endTime) - new Date(log.startTime)) / 3600000).toFixed(1) : '—';
          return (
            <View key={idx} style={s.histCard}>
              <View>
                <Text style={s.histDate}>{new Date(log.startTime).toLocaleDateString()}</Text>
                <Text style={s.histTime}>{durationH}h / {log.targetDurationHours}h target</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: log.status === 'completed' ? COLORS.primaryContainer + '20' : COLORS.danger + '20' }]}>
                <Text style={[s.statusText, { color: log.status === 'completed' ? COLORS.primaryContainer : COLORS.danger }]}>
                  {log.status === 'completed' ? '✓' : '✗'}
                </Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="Fasting" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: COLORS.primaryContainer, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  activeCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xxl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryContainer, marginBottom: SPACING.xxl },
  activeLabel: { fontSize: FONT.sizes.xs, color: COLORS.primaryContainer, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 56, color: COLORS.textPrimary, fontWeight: '900', fontVariant: ['tabular-nums'], marginVertical: SPACING.lg },
  progressBar: { width: '100%', height: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.round, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.round },
  progressText: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: SPACING.sm },
  endBtn: { backgroundColor: COLORS.danger, borderRadius: RADIUS.round, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, marginTop: SPACING.xl },
  endBtnText: { color: '#fff', fontWeight: '900', fontSize: FONT.sizes.sm, letterSpacing: 1 },
  startSection: { marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.md },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  optCard: { width: (width - SPACING.xl * 2 - SPACING.md) / 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  optLabel: { fontSize: FONT.sizes.xl, color: COLORS.primaryContainer, fontWeight: '900' },
  optHours: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
  histCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  histDate: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
  histTime: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { width: 32, height: 32, borderRadius: RADIUS.round, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 16, fontWeight: '900' },
});
