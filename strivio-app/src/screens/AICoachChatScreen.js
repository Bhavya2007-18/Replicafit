import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

const messages = [
  { role: 'ai', text: "Hey Alex! 👋 I'm your AI Coach. What would you like to work on today?" },
  { role: 'user', text: "I want to improve my squat form" },
  { role: 'ai', text: "Great choice! Based on your last session, your squat depth was at 87% accuracy. The main area to improve is keeping your chest up during the descent. Want me to guide you through a corrective drill?" },
];

export default function AICoachChatScreen({ navigation }) {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(messages);

  const sendMessage = () => {
    if (!input.trim()) return;
    setChat([...chat, { role: 'user', text: input }, { role: 'ai', text: "I'll analyze that and prepare a personalized recommendation for you. Check your workout plan for the updated routine! 💪" }]);
    setInput('');
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>AI Coach</Text>
        <View style={s.statusRow}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>Online</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.chatArea}>
        {chat.map((msg, i) => (
          <View key={i} style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
            <Text style={[s.bubbleText, msg.role === 'user' && s.bubbleTextUser]}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Ask your AI coach..."
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
          <Text style={s.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md, marginBottom: SPACING.sm },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: SPACING.sm },
  statusText: { fontSize: FONT.sizes.xs, color: COLORS.success },
  chatArea: { padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  bubble: { maxWidth: '85%', padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.md },
  bubbleAI: { backgroundColor: COLORS.surfaceLight, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  bubbleUser: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  bubbleText: { fontSize: FONT.sizes.md, color: COLORS.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: COLORS.textOnPrimary },
  inputRow: { flexDirection: 'row', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONT.sizes.md, marginRight: SPACING.sm },
  sendBtn: { backgroundColor: COLORS.primary, width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontSize: 22, color: COLORS.textOnPrimary, ...FONT.bold },
});
