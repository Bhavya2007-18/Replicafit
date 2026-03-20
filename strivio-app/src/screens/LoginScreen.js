import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login, register, continueAsGuest } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        if (!name.trim()) { setError('OPERATIVE NAME REQUIRED'); setLoading(false); return; }
        result = await register(name, email, password);
      }
      if (result.error) setError(result.error);
    } catch (e) {
      setError('CONNECTION FAILURE: RETRY UPLINK');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          
          <View style={s.hero}>
            <Text style={s.logo}>REPLICAFIT</Text>
            <View style={s.accentLine} />
            <Text style={s.tagline}>THE FUTURE OF HUMAN PERFORMANCE</Text>
          </View>

          <View style={s.formBox}>
            <Text style={s.formTitle}>{isLogin ? 'INITIALIZING UPLINK' : 'CREATING OPERATIVE'}</Text>

            {!isLogin && (
              <TextInput style={s.input} placeholder="NAME / ID" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
            )}
            <TextInput style={s.input} placeholder="EMAIL ADDRESS" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={s.input} placeholder="SECURE KEY" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              <Text style={s.btnText}>{loading ? 'SYNCING...' : isLogin ? 'ENTER THE VAULT' : 'JOIN THE ELITE'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.switchBtn} onPress={() => { setIsLogin(!isLogin); setError(''); }}>
              <Text style={s.switchText}>
                {isLogin ? "NEW OPERATIVE? REGISTER" : 'EXISTING OPERATIVE? LOGIN'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.guestBtn} onPress={continueAsGuest}>
            <Text style={s.guestText}>CONTINUE AS GUEST ›</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  
  hero: { alignItems: 'center', marginBottom: height * 0.08 },
  logo: { fontSize: 52, color: COLORS.textPrimary, fontWeight: '900', fontStyle: 'italic', letterSpacing: 6 },
  accentLine: { width: 100, height: 4, backgroundColor: COLORS.primaryContainer, marginTop: -8, marginBottom: 8 },
  tagline: { fontSize: 10, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 4 },

  formBox: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xxl, 
    padding: SPACING.xl, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 20,
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 0.1,
    shadowRadius: 30
  },
  formTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 2, marginBottom: SPACING.xl, textAlign: 'center' },
  
  input: { 
    backgroundColor: COLORS.surfaceElevated, 
    borderRadius: RADIUS.md, 
    padding: SPACING.lg, 
    color: COLORS.textPrimary, 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: SPACING.md, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    letterSpacing: 1
  },
  
  error: { color: COLORS.error, fontSize: 10, fontWeight: '800', marginBottom: SPACING.md, textAlign: 'center' },
  
  btn: { 
    backgroundColor: COLORS.primaryContainer, 
    padding: SPACING.xl, 
    borderRadius: RADIUS.round, 
    alignItems: 'center', 
    marginTop: SPACING.lg,
    elevation: 10,
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 0.3,
    shadowRadius: 15
  },
  btnText: { fontSize: 14, fontWeight: '900', color: COLORS.background, letterSpacing: 1 },
  
  switchBtn: { marginTop: SPACING.xl, alignItems: 'center' },
  switchText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  
  guestBtn: { marginTop: SPACING.xxl, padding: SPACING.lg, alignItems: 'center' },
  guestText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
});
