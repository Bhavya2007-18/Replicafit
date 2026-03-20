import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Dimensions, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

const { width } = Dimensions.get('window');

const PROVIDERS = [
  { id: 'garmin', name: 'Garmin Connect', icon: '⌚', color: '#0097d3' },
  { id: 'fitbit', name: 'Fitbit', icon: '📱', color: '#00b0b9' },
  { id: 'withings', name: 'Withings', icon: '⚖️', color: '#6ec6ff' },
  { id: 'polar', name: 'Polar Flow', icon: '❄️', color: '#d32f2f' },
  { id: 'apple_health', name: 'Apple Health', icon: '🍎', color: '#ff2d55' },
  { id: 'google_fit', name: 'Google Fit', icon: '💚', color: '#4caf50' },
];

export default function DeviceIntegrationsScreen({ navigation }) {
  const [connected, setConnected] = useState([]);
  const [family, setFamily] = useState(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  useEffect(() => {
    api.getConnectedDevices().then(d => { if (Array.isArray(d)) setConnected(d); }).catch(() => {});
    api.getFamily().then(d => { if (d && d.family) setFamily(d.family); }).catch(() => {});
  }, []);

  const isConnected = (provider) => connected.some(d => d.provider === provider);

  const handleConnect = async (provider) => {
    if (isConnected(provider)) {
      try {
        await api.disconnectDevice(provider);
        setConnected(prev => prev.filter(d => d.provider !== provider));
      } catch (e) { console.log(e); }
    } else {
      // In production, this would open an OAuth flow
      Alert.alert('Connect ' + provider, 'OAuth integration coming soon! The backend endpoint is ready.');
    }
  };

  const handleCreateFamily = async () => {
    try {
      const result = await api.createFamily('My Family');
      setFamily(result.group);
      Alert.alert('Family Created!', `Invite Code: ${result.inviteCode}`);
    } catch (e) { console.log(e); }
  };

  const handleJoinFamily = async () => {
    if (!inviteCodeInput.trim()) return Alert.alert('Error', 'Please enter an invite code');
    try {
      const result = await api.joinFamily(inviteCodeInput.trim().toUpperCase());
      if (result.status === 'joined') {
        Alert.alert('Success', `Joined family: ${result.groupName}`);
        const famData = await api.getFamily();
        if (famData && famData.family) setFamily(famData.family);
      } else {
        Alert.alert('Error', result.error || 'Failed to join family');
      }
    } catch (e) { Alert.alert('Error', 'Invalid invite code or already a member.'); }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>⚙️ INTEGRATIONS</Text>
        <Text style={s.subtitle}>Connect your devices & manage access</Text>

        {/* Device Grid */}
        <Text style={s.sectionTitle}>HEALTH DEVICES</Text>
        <View style={s.grid}>
          {PROVIDERS.map(p => {
            const active = isConnected(p.id);
            return (
              <TouchableOpacity key={p.id} style={[s.deviceCard, active && { borderColor: p.color }]}
                onPress={() => handleConnect(p.id)}>
                <Text style={s.deviceIcon}>{p.icon}</Text>
                <Text style={s.deviceName}>{p.name}</Text>
                <View style={[s.statusDot, { backgroundColor: active ? p.color : COLORS.textMuted }]} />
                <Text style={[s.statusLabel, active && { color: p.color }]}>{active ? 'CONNECTED' : 'TAP TO LINK'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Family Access */}
        <Text style={s.sectionTitle}>FAMILY ACCESS</Text>
        {family ? (
          <View style={s.familyCard}>
            <Text style={s.familyName}>{family.name}</Text>
            <Text style={s.familyMembers}>{family.members?.length || 0} members</Text>
            <Text style={s.familyCode}>Invite Code: {family.inviteCode}</Text>
          </View>
        ) : showJoinInput ? (
          <View style={s.familyCard}>
            <TextInput 
              style={s.input} 
              placeholder="ENTER INVITE CODE" 
              placeholderTextColor={COLORS.textMuted}
              value={inviteCodeInput}
              onChangeText={setInviteCodeInput}
              autoCapitalize="characters"
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md}}>
              <TouchableOpacity onPress={() => setShowJoinInput(false)} style={{padding: SPACING.sm}}>
                <Text style={{color: COLORS.textMuted, fontSize: 10, fontWeight: '800'}}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.joinBtn} onPress={handleJoinFamily} disabled={!inviteCodeInput.trim()}>
                <Text style={s.joinBtnText}>JOIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{gap: SPACING.md}}>
            <TouchableOpacity style={s.createFamilyBtn} onPress={handleCreateFamily}>
              <Text style={s.createFamilyText}>+ CREATE FAMILY GROUP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.createFamilyBtn, {borderColor: COLORS.textMuted}]} onPress={() => setShowJoinInput(true)}>
              <Text style={[s.createFamilyText, {color: COLORS.textMuted}]}>JOIN EXISTING FAMILY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MFA Status */}
        <Text style={s.sectionTitle}>SECURITY</Text>
        <MFASection />

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="Settings" />
    </SafeAreaView>
  );
}

function MFASection() {
  const [mfaStatus, setMfaStatus] = useState(null);
  const { useNavigation } = require('@react-navigation/native');
  const nav = useNavigation();

  useEffect(() => {
    api.getMFAStatus().then(setMfaStatus).catch(console.log);
  }, []);

  return (
    <View style={s.mfaCard}>
      <View style={s.mfaRow}>
        <View>
          <Text style={s.mfaTitle}>Two-Factor Auth (TOTP)</Text>
          <Text style={s.mfaStatus}>{mfaStatus?.mfaEnabled ? '🟢 Enabled' : '🔴 Disabled'}</Text>
        </View>
        <TouchableOpacity style={s.mfaBtn} onPress={() => nav.navigate('MFASetup')}>
          <Text style={s.mfaBtnText}>{mfaStatus?.mfaEnabled ? 'RESET' : 'ENABLE'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.mfaRow, { marginTop: SPACING.md }]}>
        <View>
          <Text style={s.mfaTitle}>Passkeys</Text>
          <Text style={s.mfaStatus}>{mfaStatus?.hasPasskeys ? '🟢 Configured' : '⚪ Not set up'}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: COLORS.primaryContainer, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.md, marginTop: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  deviceCard: { width: (width - SPACING.xl * 2 - SPACING.md) / 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  deviceIcon: { fontSize: 28, marginBottom: 6 },
  deviceName: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '700', textAlign: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: SPACING.sm },
  statusLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  familyCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.primaryContainer },
  familyName: { fontSize: FONT.sizes.lg, color: COLORS.textPrimary, fontWeight: '800' },
  familyMembers: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4 },
  familyCode: { fontSize: FONT.sizes.sm, color: COLORS.primaryContainer, fontWeight: '600', marginTop: SPACING.sm },
  createFamilyBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  createFamilyText: { color: COLORS.primaryContainer, fontWeight: '700', fontSize: FONT.sizes.sm, letterSpacing: 1 },
  input: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.md, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', letterSpacing: 2, textAlign: 'center' },
  joinBtn: { backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.md, padding: SPACING.sm, paddingHorizontal: SPACING.xl, alignItems: 'center', justifyContent: 'center' },
  joinBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  mfaCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  mfaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mfaTitle: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, fontWeight: '600' },
  mfaStatus: { fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  mfaBtn: { backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.round, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl },
  mfaBtnText: { color: COLORS.onPrimary, fontWeight: '900', fontSize: FONT.sizes.xs, letterSpacing: 1 },
});
