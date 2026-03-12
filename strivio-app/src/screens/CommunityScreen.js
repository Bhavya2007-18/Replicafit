import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import api from '../services/api';

export default function CommunityScreen({ navigation }) {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    api.getChallenges().then(data => {
      if (Array.isArray(data)) setChallenges(data);
    }).catch(console.log);
  }, []);

  const handleJoin = async (id) => {
    await api.joinChallenge(id);
    const updated = await api.getChallenges();
    if (Array.isArray(updated)) setChallenges(updated);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Community Challenges</Text>

        {challenges.map((c, i) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate) - Date.now()) / 86400000));
          return (
            <View key={i} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardIcon}>{c.icon || '🏆'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{c.title}</Text>
                  <Text style={s.cardMeta}>{c.participants?.length || 0} members • {daysLeft} days left</Text>
                </View>
              </View>
              <Text style={s.cardDesc}>{c.description}</Text>
              <TouchableOpacity style={s.joinBtn} onPress={() => handleJoin(c._id)}>
                <Text style={s.joinBtnText}>Join Challenge</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {challenges.length === 0 && <Text style={s.empty}>No active challenges. Start the server and run the seed script!</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.lg },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  cardIcon: { fontSize: 32, marginRight: SPACING.md },
  cardTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  cardMeta: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  cardDesc: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  joinBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  joinBtnText: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.textOnPrimary },
  empty: { fontSize: FONT.sizes.md, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xxl },
});
