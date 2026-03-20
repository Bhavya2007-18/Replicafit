import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function SleepLoggerScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSleepLogs().then(data => { if (Array.isArray(data)) setLogs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const logQuickSleep = async (hours) => {
    const endTime = new Date();
    const startTime = new Date(endTime - hours * 3600000);
    const newRecord = { startTime: startTime.toISOString(), endTime: endTime.toISOString(), durationMinutes: hours * 60, qualityScore: Math.min(hours * 12, 100) };
    
    setLogs(prev => [newRecord, ...prev]);
    try {
      await api.logSleep({ startTime, endTime, qualityScore: newRecord.qualityScore });
    } catch (e) { console.log('Guest save skipped'); }
  };

  const avgDuration = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / logs.length)
    : 0;
  const avgQuality = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + (l.qualityScore || 0), 0) / logs.length)
    : 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>💤 SLEEP TRACKER</Text>
        <Text style={s.subtitle}>Monitor your recovery patterns</Text>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statEmoji}>🌙</Text>
            <Text style={s.statValue}>{Math.floor(avgDuration / 60)}h {avgDuration % 60}m</Text>
            <Text style={s.statLabel}>AVG DURATION</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statEmoji}>⭐</Text>
            <Text style={s.statValue}>{avgQuality}%</Text>
            <Text style={s.statLabel}>AVG QUALITY</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statEmoji}>📊</Text>
            <Text style={s.statValue}>{logs.length}</Text>
            <Text style={s.statLabel}>TOTAL LOGS</Text>
          </View>
        </View>

        {/* Quick Log */}
        <Text style={s.sectionTitle}>QUICK LOG</Text>
        <View style={s.quickRow}>
          {[5, 6, 7, 8, 9].map(h => (
            <TouchableOpacity key={h} style={[s.quickBtn, h === 8 && s.quickBtnActive]} onPress={() => logQuickSleep(h)}>
              <Text style={[s.quickBtnText, h === 8 && s.quickBtnTextActive]}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sleep History */}
        <Text style={s.sectionTitle}>RECENT SESSIONS</Text>
        {logs.slice(0, 14).map((log, idx) => {
          const dur = log.durationMinutes || 0;
          const hours = Math.floor(dur / 60);
          const mins = dur % 60;
          const qualityColor = (log.qualityScore || 0) >= 70 ? COLORS.primaryContainer : (log.qualityScore || 0) >= 40 ? COLORS.warning : COLORS.danger;
          return (
            <View key={idx} style={s.logCard}>
              <View>
                <Text style={s.logDate}>{new Date(log.startTime).toLocaleDateString()}</Text>
                <Text style={s.logTime}>{new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={s.logRight}>
                <Text style={s.logDuration}>{hours}h {mins}m</Text>
                <View style={[s.qualityBadge, { backgroundColor: qualityColor + '20', borderColor: qualityColor }]}>
                  <Text style={[s.qualityText, { color: qualityColor }]}>{log.qualityScore || 0}%</Text>
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="SleepLogger" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: COLORS.primaryContainer, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: FONT.sizes.lg, color: COLORS.textPrimary, fontWeight: '900' },
  statLabel: { fontSize: 8, color: COLORS.textMuted, letterSpacing: 1, marginTop: 2 },
  sectionTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.md },
  quickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xxl },
  quickBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  quickBtnActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  quickBtnText: { fontSize: FONT.sizes.md, color: COLORS.textPrimary, fontWeight: '700' },
  quickBtnTextActive: { color: COLORS.onPrimary },
  logCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  logDate: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
  logTime: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logDuration: { fontSize: FONT.sizes.md, color: COLORS.textPrimary, fontWeight: '800' },
  qualityBadge: { borderRadius: RADIUS.round, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: 4, borderWidth: 1 },
  qualityText: { fontSize: 10, fontWeight: '700' },
});
