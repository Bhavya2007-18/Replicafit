// Stitch Design Theme - Workout Dashboard
// Color Mode: DARK | Font: Inter | Roundness: 8px | Custom Color: #d4af35

export const COLORS = {
  // Core
  background: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceLight: '#131313',
  surfaceElevated: '#262626',
  surfaceDim: '#0e0e0e',
  
  // Neon Lime Accent (Primary - ReplicaFit)
  primary: '#f3ffca',        // Soft primary
  primaryContainer: '#cafd00', // Neon primary
  primaryDim: '#beee00',
  primaryFixed: '#cafd00',
  onPrimary: '#516700',
  onPrimaryContainer: '#4a5e00',
  
  // Secondary / Tertiary (ReplicaFit)
  secondary: '#ede855',
  secondaryContainer: '#646100',
  onSecondary: '#575400',
  tertiary: '#ffeea9',
  tertiaryContainer: '#fddf46',
  onTertiary: '#675800',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#adaaaa',
  textMuted: '#767575',
  textOnPrimary: '#516700',
  
  // Borders & Outlines
  border: '#262626',
  borderLight: '#484847',
  outline: '#767575',
  outlineVariant: '#484847',
  
  // Status
  success: '#cafd00', // Using primary neon for success
  warning: '#ede855',
  danger: '#ff7351',
  error: '#ff7351',
  errorContainer: '#b92902',
  
  // Gradients (ReplicaFit Kinetic)
  gradientKinetic: ['#f3ffca', '#cafd00'],
  gradientDark: ['#1a1a1a', '#0e0e0e'],
  gradientGlass: ['rgba(38, 38, 38, 0.6)', 'rgba(14, 14, 14, 0.8)'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24, // High-impact bento cards
  xxxl: 32, // Large containers
  round: 999,
};

export const FONT = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  black: { fontWeight: '900' }, // For that high-impact italic look
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 48,
    giant: 72,
  },
};
