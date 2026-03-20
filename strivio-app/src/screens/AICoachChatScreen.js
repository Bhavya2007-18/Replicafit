import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getDailyTargets, getGuidance } from '../services/nutritionGuidanceEngine';
import api from '../services/api';

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
        { from: 'ai', text: `Hey ${user?.name?.split(' ')[0] || 'Athlete'}! I'm your AI coach. Here's what I've noticed:`, time: 'now' },
      ];

      if (Array.isArray(insights) && insights.length > 0) {
        insights.forEach(i => {
          initialMessages.push({ from: 'ai', text: i.message, time: 'now', type: i.type });
        });
      }

      if (progress) {
        if (progress.streak > 0) {
          initialMessages.push({ from: 'ai', text: `🔥 You're on a ${progress.streak}-day streak! Don't break it.`, time: 'now' });
        }
        if (progress.totalWorkouts > 0) {
          initialMessages.push({ from: 'ai', text: `📊 Overall stats: ${progress.totalWorkouts} workouts, ${progress.avgAccuracy}% avg accuracy, Level ${progress.level}.`, time: 'now' });
        }
      }

      if (initialMessages.length === 1) {
        initialMessages.push({ from: 'ai', text: 'Complete some workouts and I\'ll start giving you personalized coaching insights!', time: 'now' });
      }

      setMessages(initialMessages);
    } catch (e) {
      setMessages([
        { from: 'ai', text: 'Hey! I\'m your AI fitness coach. Ask me anything about your training!', time: 'now' },
      ]);
    }

    // Load nutrition context
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
      return 'Go to the Workout Plans screen to generate a personalized plan based on your fitness goal and activity level. I\'ll adapt it automatically as you progress!';
    }
    if (msg.includes('form') || msg.includes('accuracy') || msg.includes('technique')) {
      return 'Start a Guided Workout — the AI camera will analyze your form in real-time and give you instant corrections. Focus on keeping knees aligned and back straight.';
    }
    if (msg.includes('diet') || msg.includes('nutrition') || msg.includes('eat') || msg.includes('food') || msg.includes('protein') || msg.includes('carb') || msg.includes('calorie')) {
      if (nutritionContext) {
        const r = nutritionContext.remaining;
        const insight = nutritionContext.insights[0] || '';
        const suggestion = nutritionContext.suggestions.length > 0 ? `Try: ${nutritionContext.suggestions.map(s => s.name).join(', ')}.` : '';
        return `${insight} You have ${r.calories} cal and ${r.protein}g protein remaining today. ${suggestion}`;
      }
      return 'Head to the Nutrition Tracker to log meals and track your macros. Based on your goal, I\'d recommend focusing on protein intake — aim for at least 1.6g per kg of body weight.';
    }
    if (msg.includes('rest') || msg.includes('recovery') || msg.includes('tired') || msg.includes('sore')) {
      return 'Recovery is crucial! Take a rest day if you\'re feeling fatigued. Try light stretching, stay hydrated, and aim for 7-8 hours of sleep. Your muscles grow during rest, not during workouts.';
    }
    if (msg.includes('goal') || msg.includes('progress')) {
      return 'Check your Progress Dashboard for detailed analytics. Set specific goals in the Goal Tracking screen — having clear targets increases success rate by 42%!';
    }
    if (msg.includes('challenge') || msg.includes('community')) {
      return 'Join a community challenge! Competing with others increases workout consistency by 34%. Check the Community tab for active challenges.';
    }
    if (msg.includes('streak')) {
      return 'Streaks are powerful motivators! Even a 10-minute workout counts toward maintaining your streak. Consistency beats intensity every time.';
    }

    return 'Great question! I analyze your workout data to give personalized advice. Try asking about form correction, workout plans, nutrition, recovery, or your progress.';
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { from: 'user', text: input.trim(), time: 'now' };
    const aiResponse = { from: 'ai', text: generateResponse(input.trim()), time: 'now' };

    setMessages(prev => [...prev, userMsg, aiResponse]);
    setInput('');

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>AI Coach</Text>
          <Text style={s.headerStatus}>● Online</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={s.chatArea} contentContainerStyle={s.chatContent}>
        {loading && <Text style={s.loadingText}>Loading insights...</Text>}
        {messages.map((msg, i) => (
          <View key={i} style={[s.bubble, msg.from === 'user' ? s.bubbleUser : s.bubbleAI]}>
            <Text style={[s.bubbleText, msg.from === 'user' && s.bubbleTextUser]}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Ask your AI coach..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
            <Text style={s.sendText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, gap: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md },
  headerTitle: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textPrimary },
  headerStatus: { fontSize: FONT.sizes.xs, color: COLORS.success },
  chatArea: { flex: 1 },
  chatContent: { padding: SPACING.xl },
  loadingText: { color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.lg },
  bubble: { maxWidth: '85%', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  bubbleAI: { backgroundColor: COLORS.surfaceLight, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  bubbleUser: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  bubbleText: { fontSize: FONT.sizes.md, color: COLORS.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: COLORS.textOnPrimary },
  inputRow: { flexDirection: 'row', padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONT.sizes.md, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { backgroundColor: COLORS.primary, width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 22, color: COLORS.textOnPrimary, ...FONT.bold },
});
