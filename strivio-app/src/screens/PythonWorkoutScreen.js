import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Dimensions, Platform, Animated
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, RADIUS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_WIDTH = Math.min(SCREEN_WIDTH, 500);
const CAMERA_HEIGHT = CAMERA_WIDTH * 1.33;

const PYTHON_API_URL =
  Platform.OS === 'web' ? 'http://localhost:5001' : 'http://10.0.2.2:5001';

const QUALITY_COLORS = {
  Perfect: '#cafd00',
  Good:    '#2ed573',
  Fair:    '#ffa502',
  Poor:    '#ff4757',
  'N/A':   '#555',
};

export default function PythonWorkoutScreen({ route, navigation }) {
  const { exercise } = route.params || {};

  const [metrics, setMetrics] = useState({
    reps: 0, left_reps: 0, right_reps: 0,
    score: 0, state: 'DOWN',
    feedback: [], fps: 0,
    curl_progress: 0,
    rep_quality: 'N/A',
    l_angle: 180, r_angle: 180,
    tempo: 0,
  });

  const [repFlash, setRepFlash]   = useState(false);
  const prevRepsRef                = useRef(0);
  const repScaleAnim               = useRef(new Animated.Value(1)).current;
  const progressAnim               = useRef(new Animated.Value(0)).current;
  const esRef                      = useRef(null);

  // ── SSE subscription (web) / fallback polling (native) ─────────────────────
  useEffect(() => {
    const handleData = (data) => {
      setMetrics(data);
      if (data.reps > prevRepsRef.current) {
        prevRepsRef.current = data.reps;
        setRepFlash(true);
        Animated.sequence([
          Animated.timing(repScaleAnim, { toValue: 1.4, duration: 120, useNativeDriver: true }),
          Animated.timing(repScaleAnim, { toValue: 1,   duration: 180, useNativeDriver: true }),
        ]).start();
        setTimeout(() => setRepFlash(false), 300);
      }
      Animated.timing(progressAnim, {
        toValue: Math.min(100, data.curl_progress ?? 0),
        duration: 80,
        useNativeDriver: false,
      }).start();
    };

    if (Platform.OS === 'web' && typeof EventSource !== 'undefined') {
      const es = new EventSource(`${PYTHON_API_URL}/metrics_stream`);
      esRef.current = es;
      es.onmessage = (e) => {
        try { handleData(JSON.parse(e.data)); } catch (_) {}
      };
      return () => es.close();
    } else {
      // Fallback: fast polling on native
      const id = setInterval(async () => {
        try {
          const r = await fetch(`${PYTHON_API_URL}/get_metrics`);
          if (r.ok) handleData(await r.json());
        } catch (_) {}
      }, 80);
      return () => clearInterval(id);
    }
  }, []);

  const getGrade = (s) => s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s > 0 ? 'D' : '--';
  const tempoColor = metrics.tempo > 0 && metrics.tempo < 1.0 ? '#ff4757'
    : metrics.tempo > 3.5 ? '#ffa502' : '#2ed573';

  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 100], outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={s.container}>

      {/* ── Header ── */}
      <View style={s.hudHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.hudAction}>EXIT</Text>
        </TouchableOpacity>
        <Text style={s.hudName}>
          {exercise?.name?.toUpperCase() ?? 'PYTHON AI COACH'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Camera + Overlays ── */}
      <View style={s.cameraWrapper}>

        {/* Stream */}
        {Platform.OS === 'web' ? (
          <img
            src={`${PYTHON_API_URL}/video_feed`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt="AI stream"
          />
        ) : (
          <WebView
            source={{ uri: `${PYTHON_API_URL}/video_feed` }}
            style={s.camera}
            scrollEnabled={false}
          />
        )}

        {/* Grade badge */}
        <View style={s.gradeBox}>
          <Text style={s.gradeLabel}>GRADE</Text>
          <Text style={s.gradeValue}>{getGrade(metrics.score)}</Text>
        </View>

        {/* State + Feedback pill */}
        <View style={s.topRight}>
          <View style={[s.statePill, { backgroundColor: metrics.state === 'TOP' ? 'rgba(202,253,0,0.25)' : 'rgba(0,0,0,0.55)' }]}>
            <Text style={[s.pillText, { color: metrics.state === 'TOP' ? COLORS.primaryContainer : '#aaa' }]}>
              {metrics.state}
            </Text>
          </View>
          {metrics.feedback.length > 0 && (
            <View style={s.feedbackPill}>
              <Text style={s.feedbackPillText} numberOfLines={1}>⚡ {metrics.feedback[0]}</Text>
            </View>
          )}
        </View>

        {/* Live elbow angles */}
        <View style={s.angleRow}>
          <View style={s.angleChip}>
            <Text style={s.angleLabel}>L ELBOW</Text>
            <Text style={s.angleVal}>{Math.round(metrics.l_angle)}°</Text>
          </View>
          <View style={s.angleChip}>
            <Text style={s.angleLabel}>R ELBOW</Text>
            <Text style={s.angleVal}>{Math.round(metrics.r_angle)}°</Text>
          </View>
        </View>

        {/* Curl progress bar (left side) */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { height: progressHeight }]} />
        </View>

        {/* Bottom metrics strip */}
        <View style={s.metricsOverlay}>
          {/* Reps */}
          <Animated.View style={[s.metricGlass, repFlash && s.metricFlash, { transform: [{ scale: repScaleAnim }] }]}>
            <Text style={[s.metricVal, repFlash && { color: COLORS.primaryContainer }]}>
              {metrics.reps}
            </Text>
            <Text style={s.metricLabel}>REPS</Text>
          </Animated.View>

          {/* Accuracy */}
          <View style={[s.metricGlass, { borderColor: COLORS.primaryContainer }]}>
            <Text style={[s.metricVal, { color: COLORS.primaryContainer }]}>{metrics.score}%</Text>
            <Text style={s.metricLabel}>ACCURACY</Text>
          </View>

          {/* Tempo */}
          <View style={s.metricGlass}>
            <Text style={[s.metricVal, { color: tempoColor }]}>
              {metrics.tempo > 0 ? `${metrics.tempo.toFixed(1)}s` : '--'}
            </Text>
            <Text style={s.metricLabel}>TEMPO</Text>
          </View>
        </View>

      </View>

      {/* ── Below camera: per-arm counters + quality ── */}
      <View style={s.belowBar}>
        {/* Left arm */}
        <View style={s.armBox}>
          <Text style={s.armLabel}>LEFT ARM</Text>
          <Text style={s.armVal}>{metrics.left_reps}</Text>
          <Text style={s.armSub}>REPS</Text>
        </View>

        {/* Rep quality badge */}
        <View style={[s.qualityBadge, { borderColor: QUALITY_COLORS[metrics.rep_quality] ?? '#555' }]}>
          <Text style={s.qualityLabel}>LAST REP</Text>
          <Text style={[s.qualityVal, { color: QUALITY_COLORS[metrics.rep_quality] ?? '#fff' }]}>
            {metrics.rep_quality}
          </Text>
          <Text style={s.qualitySub}>{metrics.fps} FPS</Text>
        </View>

        {/* Right arm */}
        <View style={s.armBox}>
          <Text style={s.armLabel}>RIGHT ARM</Text>
          <Text style={s.armVal}>{metrics.right_reps}</Text>
          <Text style={s.armSub}>REPS</Text>
        </View>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  hudHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  hudName:   { color: COLORS.textPrimary, fontWeight: '900', letterSpacing: 1, fontSize: 13 },
  hudAction: { color: COLORS.primaryContainer, fontWeight: '700', fontSize: 12 },

  cameraWrapper: {
    width: CAMERA_WIDTH, height: CAMERA_HEIGHT,
    backgroundColor: '#000', overflow: 'hidden',
    alignSelf: 'center', borderRadius: RADIUS.xl,
  },
  camera: { width: '100%', height: '100%' },

  /* Grade badge */
  gradeBox: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.md, alignItems: 'center', zIndex: 20,
  },
  gradeLabel: { fontSize: 8,  fontWeight: '900', color: COLORS.background },
  gradeValue: { fontSize: 28, fontWeight: '900', color: COLORS.background, lineHeight: 30 },

  /* State + feedback top-right */
  topRight: {
    position: 'absolute', top: 16, right: 16, alignItems: 'flex-end', zIndex: 20, gap: 6,
  },
  statePill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  pillText:  { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  feedbackPill: {
    backgroundColor: 'rgba(255,71,87,0.2)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.5)',
    maxWidth: 170,
  },
  feedbackPillText: { fontSize: 9, fontWeight: '800', color: '#ff4757' },

  /* Elbow angles */
  angleRow: {
    position: 'absolute', top: 90, left: 16,
    flexDirection: 'column', gap: 6, zIndex: 20,
  },
  angleChip: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  angleLabel: { fontSize: 7, fontWeight: '900', color: '#888', letterSpacing: 1 },
  angleVal:   { fontSize: 14, fontWeight: '900', color: '#fff' },

  /* Vertical progress bar */
  progressTrack: {
    position: 'absolute', top: 50, bottom: 80, right: 16, width: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end', zIndex: 20,
  },
  progressFill: {
    width: '100%', backgroundColor: COLORS.primaryContainer, borderRadius: 4,
  },

  /* Bottom metrics strip */
  metricsOverlay: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 20,
  },
  metricGlass: {
    backgroundColor: 'rgba(20,20,20,0.88)',
    width: (CAMERA_WIDTH - 56) / 3,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  metricFlash: { borderColor: COLORS.primaryContainer, borderWidth: 2 },
  metricVal:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  metricLabel: { fontSize: 8,  fontWeight: '700', color: '#666', marginTop: 1 },

  /* Below camera row */
  belowBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, marginTop: SPACING.lg,
  },
  armBox: { alignItems: 'center', flex: 1 },
  armLabel: { fontSize: 8,  fontWeight: '900', color: '#555', letterSpacing: 1 },
  armVal:   { fontSize: 36, fontWeight: '900', color: '#fff' },
  armSub:   { fontSize: 8,  fontWeight: '700', color: '#555' },

  qualityBadge: {
    alignItems: 'center', flex: 1.2,
    borderWidth: 2, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qualityLabel: { fontSize: 8,  fontWeight: '900', color: '#555', letterSpacing: 2 },
  qualityVal:   { fontSize: 20, fontWeight: '900', marginVertical: 2 },
  qualitySub:   { fontSize: 8,  fontWeight: '700', color: '#555' },
});
