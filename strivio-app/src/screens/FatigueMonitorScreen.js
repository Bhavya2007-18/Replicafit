import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import { collectSignals, resetSignalCollector } from '../services/signalCollector';
import { computeFatigueScore, generateFeedback, analyzeExerciseQuality, getRecoveryRecommendation } from '../strivio_core_engine/fatigueModel';

const { width } = Dimensions.get('window');

export default function FatigueMonitorScreen({ route, navigation }) {
  const { exerciseId, exerciseName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState(null);
  const [fatigueScore, setFatigueScore] = useState(0);
  const [feedback, setFeedback] = useState('Collecting signals...');
  const [quality, setQuality] = useState(null);
  const [recovery, setRecovery] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Animation values
  const [scoreAnimation] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Start pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    if (isMonitoring) {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(1);
    }
    
    return () => pulse.stop();
  }, [isMonitoring]);

  // Main monitoring function
  const runFatigueAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      
      // Collect signals from sensors
      const collectedSignals = await collectSignals();
      setSignals(collectedSignals);
      
      // Compute fatigue score
      const score = computeFatigueScore(collectedSignals);
      setFatigueScore(score);
      
      // Animate score
      Animated.timing(scoreAnimation, {
        toValue: score,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      
      // Generate feedback
      const advice = generateFeedback(score, exerciseName);
      setFeedback(advice);
      
      // Analyze exercise quality
      const qualityMetrics = analyzeExerciseQuality(collectedSignals);
      setQuality(qualityMetrics);
      
      // Get recovery recommendation
      const recoveryAdvice = getRecoveryRecommendation(score);
      setRecovery(recoveryAdvice);
      
    } catch (error) {
      console.error('Fatigue analysis error:', error);
      setFeedback('⚠️ Unable to analyze fatigue. Please check sensor connections.');
    } finally {
      setLoading(false);
    }
  }, [exerciseName]);

  // Initial analysis
  useEffect(() => {
    runFatigueAnalysis();
    
    // Cleanup
    return () => {
      resetSignalCollector();
    };
  }, []);

  // Auto-refresh every 30 seconds if monitoring
  useEffect(() => {
    let interval;
    if (isMonitoring) {
      interval = setInterval(runFatigueAnalysis, 30000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, runFatigueAnalysis]);

  // Get score color
  const getScoreColor = (score) => {
    if (score > 70) return '#ff4757'; // Red - High fatigue
    if (score > 40) return '#ffa502'; // Orange - Moderate
    if (score > 20) return '#2ed573'; // Green - Low
    return '#7bed9f'; // Light green - Fresh
  };

  // Get score label
  const getScoreLabel = (score) => {
    if (score > 70) return 'HIGH FATIGUE';
    if (score > 40) return 'MODERATE FATIGUE';
    if (score > 20) return 'LOW FATIGUE';
    return 'FRESH';
  };

  const interpolatedScore = scoreAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>‹ BACK</Text>
          </TouchableOpacity>
          <Text style={s.title}>FATIGUE MONITOR</Text>
          {exerciseName && (
            <Text style={s.subtitle}>{exerciseName.toUpperCase()}</Text>
          )}
        </View>

        {/* Score Circle */}
        <View style={s.scoreContainer}>
          <Animated.View 
            style={[
              s.scoreCircle, 
              { 
                backgroundColor: getScoreColor(fatigueScore),
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Text style={s.scoreNumber}>{fatigueScore}</Text>
            <Text style={s.scoreLabel}>SCORE</Text>
          </Animated.View>
          
          <Text style={[s.fatigueLabel, { color: getScoreColor(fatigueScore) }]}>
            {getScoreLabel(fatigueScore)}
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primaryContainer} />
            <Text style={s.loadingText}>Analyzing biometric signals...</Text>
          </View>
        )}

        {/* Feedback Card */}
        {!loading && (
          <View style={s.feedbackCard}>
            <Text style={s.sectionHeader}>DOCTOR'S ASSESSMENT</Text>
            <Text style={s.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* Recovery Recommendation */}
        {!loading && recovery && (
          <View style={s.recoveryCard}>
            <Text style={s.sectionHeader}>RECOVERY PROTOCOL</Text>
            <Text style={s.recoveryText}>{recovery}</Text>
          </View>
        )}

        {/* Signal Details */}
        {!loading && signals && (
          <View style={s.signalsCard}>
            <Text style={s.sectionHeader}>BIOMETRIC SIGNALS</Text>
            
            <View style={s.signalRow}>
              <Text style={s.signalLabel}>Heart Rate</Text>
              <Text style={s.signalValue}>{Math.round(signals.hr)} BPM</Text>
            </View>
            
            <View style={s.signalRow}>
              <Text style={s.signalLabel}>HRV (RMSSD)</Text>
              <Text style={s.signalValue}>{Math.round(signals.hrv)} ms</Text>
            </View>
            
            <View style={s.signalRow}>
              <Text style={s.signalLabel}>Rep Speed</Text>
              <Text style={s.signalValue}>{signals.repSpeed.toFixed(2)} reps/s</Text>
            </View>
            
            <View style={s.signalRow}>
              <Text style={s.signalLabel}>Range of Motion</Text>
              <Text style={s.signalValue}>{Math.round(signals.rom)}°</Text>
            </View>
          </View>
        )}

        {/* Exercise Quality */}
        {!loading && quality && (
          <View style={s.qualityCard}>
            <Text style={s.sectionHeader}>EXERCISE QUALITY</Text>
            
            <View style={s.qualityRow}>
              <Text style={s.qualityLabel}>Power Output</Text>
              <View style={[s.qualityBadge, { backgroundColor: getQualityColor(quality.power) }]}>
                <Text style={s.qualityBadgeText}>{quality.power}</Text>
              </View>
            </View>
            
            <View style={s.qualityRow}>
              <Text style={s.qualityLabel}>Mobility</Text>
              <View style={[s.qualityBadge, { backgroundColor: getQualityColor(quality.mobility) }]}>
                <Text style={s.qualityBadgeText}>{quality.mobility}</Text>
              </View>
            </View>
            
            <View style={s.qualityRow}>
              <Text style={s.qualityLabel}>Cardio Stress</Text>
              <View style={[s.qualityBadge, { backgroundColor: getStressColor(quality.cardioStress) }]}>
                <Text style={s.qualityBadgeText}>{quality.cardioStress}</Text>
              </View>
            </View>
            
            <View style={s.qualityRow}>
              <Text style={s.qualityLabel}>Recovery Status</Text>
              <View style={[s.qualityBadge, { backgroundColor: getRecoveryColor(quality.recoveryStatus) }]}>
                <Text style={s.qualityBadgeText}>{quality.recoveryStatus}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.monitorBtn, isMonitoring && s.monitorBtnActive]} 
          onPress={() => setIsMonitoring(!isMonitoring)}
        >
          <Text style={s.monitorBtnText}>
            {isMonitoring ? '⏹ STOP MONITORING' : '▶ START MONITORING'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={s.refreshBtn} onPress={runFatigueAnalysis} disabled={loading}>
          <Text style={s.refreshBtnText}>↻ REFRESH NOW</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Helper functions for quality colors
const getQualityColor = (level) => {
  const colors = {
    'High': '#2ed573',
    'Excellent': '#2ed573',
    'Good': '#7bed9f',
    'Moderate': '#ffa502',
    'Fair': '#ffa502',
    'Low': '#ff4757',
    'Limited': '#ff4757'
  };
  return colors[level] || '#888';
};

const getStressColor = (level) => {
  const colors = {
    'Normal': '#2ed573',
    'Moderate': '#ffa502',
    'High': '#ff4757'
  };
  return colors[level] || '#888';
};

const getRecoveryColor = (level) => {
  const colors = {
    'Good': '#2ed573',
    'Fair': '#ffa502',
    'Poor': '#ff4757'
  };
  return colors[level] || '#888';
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 120 },
  
  header: { marginTop: SPACING.xl, marginBottom: SPACING.xxl },
  backBtn: { marginBottom: SPACING.lg },
  backText: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: '900', fontStyle: 'italic', color: COLORS.textPrimary, letterSpacing: 2 },
  subtitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 4, letterSpacing: 1 },
  
  scoreContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
  scoreCircle: { 
    width: 150, 
    height: 150, 
    borderRadius: 75, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  scoreNumber: { fontSize: 48, fontWeight: '900', color: '#fff' },
  scoreLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  fatigueLabel: { fontSize: 14, fontWeight: '900', marginTop: SPACING.lg, letterSpacing: 2 },
  
  loadingContainer: { alignItems: 'center', marginVertical: SPACING.xxl },
  loadingText: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: 12 },
  
  feedbackCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryContainer
  },
  sectionHeader: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 3, marginBottom: SPACING.md },
  feedbackText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 22 },
  
  recoveryCard: {
    backgroundColor: 'rgba(202, 253, 0, 0.1)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(202, 253, 0, 0.3)'
  },
  recoveryText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryContainer, letterSpacing: 0.5 },
  
  signalsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg
  },
  signalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  signalLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  signalValue: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  
  qualityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  qualityLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.sm
  },
  qualityBadgeText: { fontSize: 10, fontWeight: '900', color: '#0a0a0a' },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    backgroundColor: 'rgba(14, 14, 14, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  monitorBtn: {
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  monitorBtnActive: {
    backgroundColor: '#ff4757'
  },
  monitorBtnText: { fontSize: 14, fontWeight: '900', color: COLORS.background, letterSpacing: 1 },
  refreshBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md
  },
  refreshBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }
});
