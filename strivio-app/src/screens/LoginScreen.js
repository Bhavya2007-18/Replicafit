import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

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
        if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
        result = await register(name, email, password);
      }
      if (result.error) setError(result.error);
    } catch (e) {
      setError('Connection failed. Is the server running?');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.logo}>Strivio</Text>
          <Text style={s.tagline}>AI-Powered Fitness Coach</Text>

          <View style={s.card}>
            <Text style={s.cardTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>

            {!isLogin && (
              <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
            )}
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={s.input} placeholder="Password" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              <Text style={s.btnText}>{loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(''); }}>
              <Text style={s.switchText}>
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.guestBtn} onPress={continueAsGuest}>
            <Text style={s.guestText}>Continue without account →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  logo: { fontSize: 48, ...FONT.bold, color: COLORS.primary, textAlign: 'center' },
  tagline: { fontSize: FONT.sizes.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxxl },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.lg, padding: SPACING.xxl, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: FONT.sizes.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  error: { color: COLORS.danger, fontSize: FONT.sizes.sm, marginBottom: SPACING.md },
  btn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.md },
  btnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
  switchText: { color: COLORS.primary, fontSize: FONT.sizes.sm, textAlign: 'center', marginTop: SPACING.xl },
  guestBtn: { marginTop: SPACING.xxl, padding: SPACING.lg, alignItems: 'center' },
  guestText: { color: COLORS.textSecondary, fontSize: FONT.sizes.md, textDecorationLine: 'underline' },
});
