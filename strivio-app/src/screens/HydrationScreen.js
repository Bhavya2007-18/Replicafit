import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.55;
const STROKE = 14;

export default function HydrationScreen({ navigation }) {
  const [data, setData] = useState({ records: [], totalMl: 0, goalMl: 3000 });

  const loadData = () => api.getHydration().then(d => {
    if (d && !d.error) setData(d);
  }).catch(() => {});
  useEffect(() => { loadData(); }, []);

  const quickAdd = async (ml) => {
    const newRecord = { _id: Date.now().toString(), amountMl: ml, date: new Date().toISOString() };
    setData(prev => ({ ...prev, records: [newRecord, ...prev.records], totalMl: prev.totalMl + ml }));
    try {
      await api.logHydration({ amountMl: ml });
    } catch (e) { console.log('Guest/offline mode fallback triggered'); }
  };

  const progress = Math.min(data.totalMl / data.goalMl, 1);
  const radius = RING_SIZE / 2 - 20;
  const circum = 2 * Math.PI * radius;
  const offset = circum - progress * circum;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>💧 HYDRATION</Text>
        <Text style={s.subtitle}>Stay hydrated, stay sharp</Text>

        {/* Ring Progress */}
        <View style={s.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke={COLORS.surfaceElevated} strokeWidth={STROKE} fill="transparent" />
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke="#4fc3f7" strokeWidth={STROKE}
              strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" fill="transparent"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
          </Svg>
          <View style={s.ringOverlay}>
            <Text style={s.ringVal}>{data.totalMl}</Text>
            <Text style={s.ringUnit}>/ {data.goalMl} ml</Text>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <Text style={s.sectionTitle}>QUICK ADD</Text>
        <View style={s.quickGrid}>
          {[
            { ml: 250, icon: '🥤', label: 'Glass' },
            { ml: 500, icon: '🍶', label: 'Bottle' },
            { ml: 150, icon: '☕', label: 'Coffee' },
            { ml: 350, icon: '🫖', label: 'Tea' },
          ].map(item => (
            <TouchableOpacity key={item.ml} style={s.quickCard} onPress={() => quickAdd(item.ml)}>
              <Text style={s.quickIcon}>{item.icon}</Text>
              <Text style={s.quickLabel}>{item.label}</Text>
              <Text style={s.quickMl}>{item.ml}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Log */}
        <Text style={s.sectionTitle}>TODAY</Text>
        {data.records.map((r, idx) => (
          <View key={idx} style={s.logRow}>
            <Text style={s.logTime}>{new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text style={s.logAmt}>+{r.amountMl}ml</Text>
          </View>
        ))}
        {data.records.length === 0 && <Text style={s.emptyText}>No entries yet today. Drink up! 💧</Text>}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="Hydration" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: '#4fc3f7', fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl },
  ringOverlay: { position: 'absolute', alignItems: 'center' },
  ringVal: { fontSize: FONT.sizes.hero, color: COLORS.textPrimary, fontWeight: '900' },
  ringUnit: { fontSize: FONT.sizes.sm, color: COLORS.textMuted },
  sectionTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.md },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  quickCard: { width: (width - SPACING.xl * 2 - SPACING.md) / 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  quickIcon: { fontSize: 28, marginBottom: 4 },
  quickLabel: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '700' },
  quickMl: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm },
  logTime: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  logAmt: { fontSize: FONT.sizes.sm, color: '#4fc3f7', fontWeight: '700' },
  emptyText: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, textAlign: 'center', padding: SPACING.xl },
});
