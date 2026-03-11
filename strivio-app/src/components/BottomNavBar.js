import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

const tabs = [
  { key: 'HomeDashboard', label: 'Home', icon: '🏠' },
  { key: 'WorkoutPlans', label: 'Plans', icon: '💪' },
  { key: 'ProgressDashboard', label: 'Stats', icon: '📊' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
];

export default function BottomNavBar({ navigation, activeRoute }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeRoute === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.key)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    paddingTop: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  icon: { fontSize: 20, marginBottom: 2 },
  iconActive: { opacity: 1 },
  label: { fontSize: FONT.sizes.xs, color: COLORS.textMuted },
  labelActive: { color: COLORS.primary, ...FONT.bold },
});
