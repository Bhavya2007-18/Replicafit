import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BlurView, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';

const tabs = [
  { key: 'HomeDashboard', label: 'HQ', icon: '🏠' },
  { key: 'ExerciseLibrary', label: 'VAULT', icon: '🏋️' },
  { key: 'ProgressDashboard', label: 'ANALYSIS', icon: '📊' },
  { key: 'DietGuidelines', label: 'FUEL', icon: '🥗' },
];

export default function BottomNavBar({ navigation, activeRoute }) {
  return (
    <View style={s.container}>
      <View style={s.bar}>
        {tabs.map((tab) => {
          const isActive = activeRoute === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={s.tab}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(tab.key)}
            >
              <View style={s.iconWrapper}>
                <Text style={[s.icon, isActive && s.iconActive]}>{tab.icon}</Text>
                {isActive && <View style={s.activeDot} />}
              </View>
              <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 14, 14, 0.9)', // Deep Black Glass
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    paddingTop: 12,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  icon: {
    fontSize: 22,
    opacity: 0.4,
  },
  iconActive: {
    opacity: 1,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    marginTop: 6,
    letterSpacing: 1,
  },
  labelActive: {
    color: COLORS.primaryContainer,
  },
});
