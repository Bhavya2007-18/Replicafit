import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function BodyMeasurementsScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ weight: '', bodyFatPercentage: '', chest: '', waist: '', hips: '' });

  useEffect(() => {
    api.getBodyMeasurements().then(d => {
      if (Array.isArray(d)) setRecords(d);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const data = {
        weight: parseFloat(form.weight) || undefined,
        bodyFatPercentage: parseFloat(form.bodyFatPercentage) || undefined,
        measurements: { chest: parseFloat(form.chest) || undefined, waist: parseFloat(form.waist) || undefined, hips: parseFloat(form.hips) || undefined }
      };

      const newRecord = { ...data, date: new Date().toISOString() };
      setRecords(prev => [newRecord, ...prev]);
      setForm({ weight: '', bodyFatPercentage: '', chest: '', waist: '', hips: '' });
      setShowForm(false);

      await api.logBodyMeasurement(data);
    } catch (e) { console.log('Guest save skipped'); }
  };

  // Mini chart of weight history
  const weightData = records.filter(r => r.weight).slice(0, 7).reverse();
  const maxW = Math.max(...weightData.map(d => d.weight), 1);
  const minW = Math.min(...weightData.map(d => d.weight), 0);
  const range = maxW - minW || 1;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>BODY METRICS</Text>
        <Text style={s.subtitle}>Track your measurements over time</Text>

        {/* Weight Trend Mini Chart */}
        {weightData.length > 1 && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>WEIGHT TREND</Text>
            <Svg width={width - 80} height={120}>
              {weightData.map((d, i) => {
                const barW = (width - 120) / weightData.length;
                const barH = ((d.weight - minW) / range) * 90;
                return (
                  <React.Fragment key={i}>
                    <Rect x={i * barW + 10} y={100 - barH} width={barW - 6} height={barH}
                      rx={4} fill={COLORS.primaryContainer} opacity={0.7 + i * 0.04} />
                    <SvgText x={i * barW + barW / 2 + 7} y={95 - barH} fontSize={9}
                      fill={COLORS.textPrimary} textAnchor="middle">{d.weight}</SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        )}

        {/* Latest Reading */}
        {records.length > 0 && (
          <View style={s.latestCard}>
            <Text style={s.cardLabel}>LATEST</Text>
            <View style={s.metricsRow}>
              <MetricPill label="Weight" value={`${records[0].weight || '—'} kg`} />
              <MetricPill label="Body Fat" value={`${records[0].bodyFatPercentage || '—'}%`} />
              <MetricPill label="Waist" value={`${records[0].measurements?.waist || '—'} cm`} />
            </View>
          </View>
        )}

        {/* Add New */}
        {showForm ? (
          <View style={s.formCard}>
            <Text style={s.formTitle}>LOG MEASUREMENT</Text>
            <InputRow label="Weight (kg)" value={form.weight} onChangeText={v => setForm({ ...form, weight: v })} />
            <InputRow label="Body Fat %" value={form.bodyFatPercentage} onChangeText={v => setForm({ ...form, bodyFatPercentage: v })} />
            <InputRow label="Chest (cm)" value={form.chest} onChangeText={v => setForm({ ...form, chest: v })} />
            <InputRow label="Waist (cm)" value={form.waist} onChangeText={v => setForm({ ...form, waist: v })} />
            <InputRow label="Hips (cm)" value={form.hips} onChangeText={v => setForm({ ...form, hips: v })} />
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>SAVE MEASUREMENT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
            <Text style={s.addBtnText}>+ LOG NEW MEASUREMENT</Text>
          </TouchableOpacity>
        )}

        {/* History */}
        <Text style={s.sectionTitle}>HISTORY</Text>
        {records.slice(0, 10).map((r, idx) => (
          <View key={idx} style={s.historyRow}>
            <Text style={s.histDate}>{new Date(r.date).toLocaleDateString()}</Text>
            <Text style={s.histVal}>{r.weight ? `${r.weight}kg` : '—'}</Text>
            <Text style={s.histVal}>{r.bodyFatPercentage ? `${r.bodyFatPercentage}%` : '—'}</Text>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="BodyMeasurements" />
    </SafeAreaView>
  );
}

function MetricPill({ label, value }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillLabel}>{label}</Text>
      <Text style={s.pillValue}>{value}</Text>
    </View>
  );
}

function InputRow({ label, value, onChangeText }) {
  return (
    <View style={s.inputRow}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChangeText}
        keyboardType="numeric" placeholderTextColor={COLORS.textMuted} placeholder="0" />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: COLORS.primaryContainer, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  chartCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  chartTitle: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.sm },
  latestCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.primaryContainer },
  cardLabel: { fontSize: FONT.sizes.xs, color: COLORS.primaryContainer, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.md },
  metricsRow: { flexDirection: 'row', gap: SPACING.sm },
  pill: { flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.xl, padding: SPACING.md, alignItems: 'center' },
  pillLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 },
  pillValue: { fontSize: FONT.sizes.lg, color: COLORS.textPrimary, fontWeight: '800', marginTop: 2 },
  formCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  formTitle: { fontSize: FONT.sizes.sm, color: COLORS.primaryContainer, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.lg },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  inputLabel: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  input: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, color: COLORS.textPrimary, width: 100, textAlign: 'center', fontSize: FONT.sizes.md },
  saveBtn: { backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.round, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.md },
  saveBtnText: { color: COLORS.onPrimary, fontWeight: '900', fontSize: FONT.sizes.sm, letterSpacing: 1 },
  addBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  addBtnText: { color: COLORS.primaryContainer, fontWeight: '700', fontSize: FONT.sizes.sm, letterSpacing: 1 },
  sectionTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.md, marginTop: SPACING.md },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm },
  histDate: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  histVal: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
});
