import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getDailyTargets, getGuidance } from '../services/nutritionGuidanceEngine';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function AICoachChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [nutritionContext, setNutritionContext] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const insights = await api.getAIInsights();
      const progress = await api.getProgress();

      const initialMessages = [
        { from: 'ai', text: `GREETINGS, ${user?.name?.toUpperCase()?.split(' ')[0] || 'OPERATIVE'}. CORE INTELLIGENCE SYNCHRONIZED.`, time: 'now' },
      ];

      if (Array.isArray(insights) && insights.length > 0) {
        insights.forEach(i => {
          initialMessages.push({ from: 'ai', text: i.message.toUpperCase(), time: 'now', type: i.type });
        });
      }

      if (progress) {
        if (progress.streak > 0) {
          initialMessages.push({ from: 'ai', text: `🔥 UPLINK ACTIVE: ${progress.streak}-DAY STREAK DETECTED. DO NOT BREAK THE SEQUENCE.`, time: 'now' });
        }
      }

      setMessages(initialMessages);
    } catch (e) {
      setMessages([
        { from: 'ai', text: 'CORE INTELLIGENCE READY. AWAITING QUERY.', time: 'now' },
      ]);
    }

    try {
      const logs = await api.getNutritionLogs();
      const todayLog = logs.find(l => new Date(l.date).toDateString() === new Date().toDateString());
      const profile = user?.profile || {};
      const targets = getDailyTargets(profile);
      const guidance = getGuidance(targets, {
        totalCalories: todayLog?.totalCalories || 0,
        totalProtein: todayLog?.totalProtein || 0,
        totalCarbs: todayLog?.totalCarbs || 0,
        totalFat: todayLog?.totalFats || 0,
      });
      setNutritionContext(guidance);
    } catch(e) {}

    setLoading(false);
  };

  const generateResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    if (msg.includes('plan') || msg.includes('workout')) {
      return 'ACCESS THE MOVEMENT VAULT TO GENERATE OPTIMIZED TRAINING PROTOCOLS BASED ON YOUR BIOMETRIC PROFILE.';
    }
    if (msg.includes('diet') || msg.includes('nutrition') || msg.includes('eat')) {
      if (nutritionContext) {
        const r = nutritionContext.remaining;
        return `FUEL MARGIN: ${r.calories} KCAL | ${r.protein}G PROTEIN REMAINING. OPTIMIZE MACRO INTAKE FOR MAXIMUM ANABOLIC OUTPUT.`;
      }
      return 'LOG YOUR FUEL INTAKE IN THE NUTRITION MODULE FOR PRECISE MACRONUTRIENT ANALYSIS.';
    }
    return 'QUERY PROCESSED. I AM ANALYZING YOUR PERFORMANCE METRICS TO OPTIMIZE YOUR EVOLUTION.';
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim().toUpperCase(), time: 'now' };
    const aiResponse = { from: 'ai', text: generateResponse(input.trim()), time: 'now' };
    setMessages(prev => [...prev, userMsg, aiResponse]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>‹ EXIT COACH</Text>
        </TouchableOpacity>
        <View style={s.coachInfo}>
          <Text style={s.logo}>REPLICAFIT AI</Text>
          <View style={s.statusRow}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>SYNCHRONIZED</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={s.chatArea} contentContainerStyle={s.chatContent}>
        {loading && <Text style={s.loadingText}>SYNCHRONIZING CORE...</Text>}
        {messages.map((msg, i) => (
          <View key={i} style={[s.bubble, msg.from === 'user' ? s.bubbleUser : s.bubbleAI]}>
            <Text style={[s.bubbleText, msg.from === 'user' && s.bubbleTextUser]}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inputArea}>
          <TextInput
            style={s.input}
            placeholder="TRANSMIT QUERY..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
            <Text style={s.sendIcon}>TRANS</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    paddingHorizontal: SPACING.xl, 
    paddingVertical: SPACING.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backText: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1 },
  coachInfo: { alignItems: 'flex-end' },
  logo: { fontSize: 14, fontWeight: '900', color: COLORS.primaryContainer, fontStyle: 'italic', letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryContainer, marginRight: 6 },
  statusText: { fontSize: 8, fontWeight: '900', color: COLORS.primaryContainer, letterSpacing: 1 },

  chatArea: { flex: 1 },
  chatContent: { padding: SPACING.xl, paddingBottom: 100 },
  loadingText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  
  bubble: { 
    maxWidth: '85%', 
    padding: SPACING.lg, 
    borderRadius: RADIUS.xl, 
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  bubbleAI: { 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    alignSelf: 'flex-start', 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 0
  },
  bubbleUser: { 
    backgroundColor: COLORS.surfaceElevated, 
    alignSelf: 'flex-end', 
    borderColor: COLORS.primaryContainer,
    borderBottomRightRadius: 0
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '700', lineHeight: 20 },
  bubbleTextUser: { color: COLORS.textPrimary },
  
  inputArea: { 
    flexDirection: 'row', 
    padding: SPACING.lg, 
    backgroundColor: COLORS.surface, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: SPACING.md
  },
  input: { 
    flex: 1, 
    backgroundColor: COLORS.surfaceElevated, 
    borderRadius: RADIUS.round, 
    paddingHorizontal: SPACING.xl, 
    paddingVertical: 12, 
    color: COLORS.textPrimary, 
    fontSize: 12, 
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  sendBtn: { 
    backgroundColor: COLORS.primaryContainer, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: RADIUS.round, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sendIcon: { fontSize: 10, fontWeight: '900', color: COLORS.background, letterSpacing: 1 },
});
