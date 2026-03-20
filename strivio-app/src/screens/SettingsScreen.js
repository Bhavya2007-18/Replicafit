import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [aiCoaching, setAiCoaching] = useState(true);

  const handleLogout = async () => {
    await logout();
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Settings & Preferences</Text>

        <View style={s.profileCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View>
            <Text style={s.profileName}>{user?.name || 'User'}</Text>
            <Text style={s.profileEmail}>{user?.email || ''}</Text>
            <Text style={s.profileLevel}>Level {user?.level || 1} • {user?.xp || 0} XP</Text>
          </View>
        </View>

        <Text style={s.section}>Preferences</Text>
        <View style={s.settingRow}><View><Text style={s.settingLabel}>Push Notifications</Text><Text style={s.settingDesc}>Workout reminders & achievements</Text></View><Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.primary }} thumbColor="#fff" /></View>
        <View style={s.settingRow}><View><Text style={s.settingLabel}>Dark Mode</Text><Text style={s.settingDesc}>Reduce eye strain during workouts</Text></View><Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.primary }} thumbColor="#fff" /></View>
        <View style={s.settingRow}><View><Text style={s.settingLabel}>AI Coaching</Text><Text style={s.settingDesc}>Real-time form corrections</Text></View><Switch value={aiCoaching} onValueChange={setAiCoaching} trackColor={{ true: COLORS.primary }} thumbColor="#fff" /></View>

        <Text style={s.section}>Account</Text>
        <TouchableOpacity style={s.menuItem}><Text style={s.menuText}>Edit Profile</Text><Text style={s.menuArrow}>›</Text></TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('DeviceIntegrations')}><Text style={s.menuText}>Integrations & Sync</Text><Text style={s.menuArrow}>›</Text></TouchableOpacity>
        <TouchableOpacity style={s.menuItem}><Text style={s.menuText}>Privacy & Data</Text><Text style={s.menuArrow}>›</Text></TouchableOpacity>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Replicafit v1.0.0</Text>
      </ScrollView>
      <BottomNavBar navigation={navigation} activeRoute="Settings" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xxl, marginTop: SPACING.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xxl },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.lg },
  avatarText: { fontSize: FONT.sizes.xl, ...FONT.bold, color: COLORS.textOnPrimary },
  profileName: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  profileEmail: { fontSize: FONT.sizes.sm, color: COLORS.textSecondary },
  profileLevel: { fontSize: FONT.sizes.xs, color: COLORS.primary, ...FONT.semibold, marginTop: 2 },
  section: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg, marginTop: SPACING.lg },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  settingLabel: { fontSize: FONT.sizes.md, ...FONT.semibold, color: COLORS.textPrimary },
  settingDesc: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  menuText: { fontSize: FONT.sizes.md, color: COLORS.textPrimary },
  menuArrow: { fontSize: 22, color: COLORS.textMuted },
  logoutBtn: { backgroundColor: COLORS.dangerMuted, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xxl },
  logoutText: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.danger },
  version: { textAlign: 'center', fontSize: FONT.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.lg },
});
