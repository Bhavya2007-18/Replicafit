import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Clipboard, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';

export default function MFASetupScreen({ navigation }) {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.setupMFA().then(setSetupData).catch(console.log);
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) return setError('ENTER 6-DIGIT CODE');
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyMFA(code);
      if (result.status === 'enabled') {
        Alert.alert('MFA ENABLED', 'Your account is now protected with Two-Factor Authentication.');
        navigation.navigate('DeviceIntegrations');
      } else {
        setError(result.error || 'VERIFICATION FAILED');
      }
    } catch (e) {
      setError('COMMUNICATION ERROR');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (setupData?.secret) {
      Clipboard.setString(setupData.secret);
      Alert.alert('COPIED', 'Secret key copied to clipboard');
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.title}>🔐 MFA SETUP</Text>
        <Text style={s.subtitle}>Secure your operative account</Text>

        <View style={s.card}>
          <Text style={s.stepTitle}>STEP 1: ADD TO AUTHENTICATOR</Text>
          <Text style={s.stepDesc}>Open Google Authenticator or Authy and add a new account using this secret key:</Text>
          
          <TouchableOpacity style={s.secretBox} onPress={copyToClipboard}>
            <Text style={s.secretText}>{setupData?.secret || 'GENERATING...'}</Text>
            <Text style={s.copyHint}>TAP TO COPY</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.stepTitle}>STEP 2: VERIFY CODE</Text>
          <Text style={s.stepDesc}>Enter the 6-digit code from your app to finalize setup:</Text>
          
          <TextInput style={s.input} placeholder="000 000" placeholderTextColor={COLORS.textMuted}
            value={code} onChangeText={setCode} keyboardType="numeric" maxLength={6} />
          
          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.verifyBtn} onPress={handleVerify} disabled={loading}>
            <Text style={s.verifyBtnText}>{loading ? 'VERIFYING...' : 'ENABLE MFA'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← CANCEL SETUP</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="Settings" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, color: COLORS.primaryContainer, fontWeight: '900', letterSpacing: 2, marginTop: SPACING.xxl },
  subtitle: { fontSize: FONT.sizes.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  stepTitle: { fontSize: FONT.sizes.sm, color: COLORS.primaryContainer, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  stepDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.lg },
  secretBox: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  secretText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  copyHint: { fontSize: 8, color: COLORS.primaryContainer, fontWeight: '900', marginTop: 4 },
  input: { backgroundColor: COLORS.surfaceElevated, borderRadius: RADIUS.lg, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 6, marginVertical: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  error: { color: COLORS.error, fontSize: 10, fontWeight: '800', marginBottom: SPACING.md, textAlign: 'center' },
  verifyBtn: { backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.round, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.sm },
  verifyBtnText: { color: COLORS.onPrimary, fontWeight: '900', fontSize: FONT.sizes.sm, letterSpacing: 1 },
  backBtn: { padding: SPACING.lg, alignItems: 'center' },
  backText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
