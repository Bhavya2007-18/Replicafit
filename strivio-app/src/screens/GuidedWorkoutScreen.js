import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Switch, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import SkeletonOverlay from '../components/SkeletonOverlay';
import { initializePoseDetection, detectPose, disposePoseDetection } from '../services/poseDetectionService';
import { classifyExercise, resetClassifier, getExerciseDisplayName } from '../services/exerciseClassifier';
import { analyzeForm, detectRep, getSessionSummary, resetFormAnalyzer, computeFormScore } from '../services/formAnalyzer';
import { detectInjuryRisks } from '../services/injuryDetection';
import { recordRep, analyzeFatigue, resetFatigueTracker } from '../services/fatigueDetection';
import { markRepStart, markRepEnd, recordAnglesForROM, calculateSymmetry, getTempoROMSummary, resetTempoROM } from '../services/tempoROMTracker';
import { calculateIntensity } from '../services/workoutIntensity';
import { speakFeedback, announceRep, announceCorrection, announceFatigue, stopSpeech, setVoiceEnabled } from '../services/voiceFeedback';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_WIDTH * 1.33;

export default function GuidedWorkoutScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [facing, setFacing] = useState('front');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);

  // Tracking state
  const [keypoints, setKeypoints] = useState([]);
  const [exercise, setExercise] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState('POSITION YOURSELF');
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [summary, setSummary] = useState(null);
  const [injuryWarnings, setInjuryWarnings] = useState([]);
  const [enablePostureCorrection, setEnablePostureCorrection] = useState(true);
  const [poseErrors, setPoseErrors] = useState([]);
  const [fatigueLevel, setFatigueLevel] = useState('low');

  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const analysisRef = useRef(null);
  const isActiveRef = useRef(false);
  const prevRepsRef = useRef(0);

  // Performance Grade Logic
  const getGrade = (acc) => {
    if (acc >= 90) return 'A+';
    if (acc >= 80) return 'A';
    if (acc >= 70) return 'B';
    if (acc >= 60) return 'C';
    return acc > 0 ? 'D' : '--';
  };

  const loadModel = useCallback(async () => {
    if (modelLoaded || modelLoading) return;
    setModelLoading(true);
    setFeedback('INITIALIZING AI...');
    const detector = await initializePoseDetection();
    if (detector) {
      setModelLoaded(true);
      setFeedback('READY TO START');
    } else {
      setFeedback('MODEL ERROR');
    }
    setModelLoading(false);
  }, [modelLoaded, modelLoading]);

  useEffect(() => {
    loadModel();
    return () => {
      disposePoseDetection();
      if (timerRef.current) clearInterval(timerRef.current);
      if (analysisRef.current) clearInterval(analysisRef.current);
    };
  }, []);

  const startWorkout = () => {
    setIsActive(true);
    isActiveRef.current = true;
    setReps(0);
    setAccuracy(0);
    setTime(0);
    setExercise(null);
    setFeedback('ANALYZING...');
    setSummary(null);
    setPoseErrors([]);
    setFatigueLevel('low');
    prevRepsRef.current = 0;
    resetClassifier();
    resetFormAnalyzer();
    resetFatigueTracker();
    resetTempoROM();
    setVoiceEnabled(true);
    markRepStart();
    speakFeedback('Workout started. Get into position.', 'high');

    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    startAnalysisLoop();
  };

  const startAnalysisLoop = () => {
    analysisRef.current = setInterval(async () => {
      if (!isActiveRef.current || !cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1, // Lower quality for speed
          skipProcessing: true,
          base64: false,
        });
        if (!photo) return;

        const { keypoints: kps, isReliable, avgConfidence } = await detectPose(photo);
        if (kps.length > 0) {
          setKeypoints(kps);
          const classification = classifyExercise(kps);
          if (classification.exercise) setExercise(classification.exercise);

          const formResult = analyzeForm(kps, classification.exercise, isReliable);
          setAccuracy(formResult.accuracy);
          setIsPaused(formResult.isPaused);
          setPoseErrors(formResult.errors || []);
          if (formResult.feedback && formResult.feedback.length > 0) {
            setFeedback(formResult.feedback[0].toUpperCase());
          }

          if (formResult.angles && classification.exercise) {
            const repResult = detectRep(formResult.angles, classification.exercise);
            if (repResult.reps > prevRepsRef.current) {
              const tempo = markRepEnd();
              recordRep(formResult.accuracy);
              announceRep(repResult.reps);
              markRepStart();
              prevRepsRef.current = repResult.reps;
              if (repResult.reps % 3 === 0) {
                const fatigue = analyzeFatigue();
                setFatigueLevel(fatigue.fatigue_level);
                if (fatigue.fatigue_level !== 'low') announceFatigue(fatigue.fatigue_level);
              }
            }
            setReps(repResult.reps);
            if (classification.angles) recordAnglesForROM(classification.angles);
          }

          if (enablePostureCorrection && formResult.errors && formResult.errors.length > 0) {
            announceCorrection(formResult.errors[0].correction);
          }
          const risks = detectInjuryRisks(kps, classification.exercise);
          setInjuryWarnings(risks);
        } else if (!isReliable) {
          setFeedback('MOVE INTO FRAME');
          setIsPaused(true);
        }
      } catch (e) {}
    }, 200);
  };

  const stopWorkout = async () => {
    setIsActive(false);
    isActiveRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);

    const sessionSummary = getSessionSummary();
    const tempoROM = getTempoROMSummary();
    const intensity = calculateIntensity(exercise, time, sessionSummary.totalReps || reps);
    const formScore = computeFormScore(
      sessionSummary.avgAccuracy || 0,
      100,
      tempoROM.avgSymmetry || 100,
      tempoROM.avgTempo > 0 ? Math.max(0, 100 - Math.abs(tempoROM.avgTempo - 2.5) * 20) : 100
    );

    const fullSummary = { ...sessionSummary, ...tempoROM, intensity, formScore };
    setSummary(fullSummary);
    speakFeedback(`Workout complete. Form score ${formScore} percent.`, 'high');
    stopSpeech();

    if (sessionSummary.totalReps > 0 || reps > 0) {
      await api.saveWorkoutSession({
        exercises: [{
          name: getExerciseDisplayName(exercise) || 'SESSION',
          reps: sessionSummary.totalReps || reps,
          accuracyScore: sessionSummary.avgAccuracy || accuracy,
          timeSpent: time,
          caloriesBurned: intensity.calories,
        }],
        totalAccuracy: sessionSummary.avgAccuracy || accuracy,
        totalDuration: time,
        totalCalories: intensity.calories,
      });
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.permissionBox}>
          <Text style={s.permTitle}>REPLICAFIT AI CAMERA</Text>
          <TouchableOpacity style={s.startBtn} onPress={requestPermission}>
            <Text style={s.startBtnText}>GRANT ACCESS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.hudHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.hudAction}>EXIT</Text></TouchableOpacity>
        <Text style={s.hudName}>{exercise ? getExerciseDisplayName(exercise).toUpperCase() : 'REPLICAFIT LIVE'}</Text>
        <TouchableOpacity onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}><Text style={s.hudAction}>FLIP</Text></TouchableOpacity>
      </View>

      <View style={s.cameraWrapper}>
        <CameraView ref={cameraRef} style={s.camera} facing={facing} pointerEvents="none" />
        
        {isActive && keypoints.length > 0 && (
          <SkeletonOverlay keypoints={keypoints} accuracy={accuracy} width={SCREEN_WIDTH} height={CAMERA_HEIGHT} />
        )}

        {/* Floating HUD Grade */}
        {isActive && (
          <View style={s.gradeBox}>
            <Text style={s.gradeLabel}>GRADE</Text>
            <Text style={s.gradeValue}>{getGrade(accuracy)}</Text>
          </View>
        )}

        {/* Floating Metrics */}
        <View style={s.metricsOverlay}>
          <View style={s.metricGlass}>
            <Text style={s.metricVal}>{reps}</Text>
            <Text style={s.metricLabel}>REPS</Text>
          </View>
          <View style={[s.metricGlass, { borderColor: COLORS.primaryContainer }]}>
            <Text style={[s.metricVal, { color: COLORS.primaryContainer }]}>{accuracy}%</Text>
            <Text style={s.metricLabel}>ACCURACY</Text>
          </View>
          <View style={s.metricGlass}>
            <Text style={s.metricVal}>{formatTime(time)}</Text>
            <Text style={s.metricLabel}>TIME</Text>
          </View>
        </View>

        {/* AI Feedback Pill */}
        <View style={s.feedbackPill}>
          <Text style={[s.pillText, isPaused && { color: COLORS.error }]}>{feedback}</Text>
        </View>

        {!isActive && !summary && (
          <View style={s.idleOverlay}>
            <Text style={s.idleText}>{modelLoading ? 'AI INITIALIZING...' : 'READY FOR TRAINING'}</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={s.controlsScroll}>
        {/* Injury & Fatigue Alerts */}
        {(injuryWarnings.length > 0 || fatigueLevel !== 'low') && isActive && (
          <View style={s.alertBox}>
            {injuryWarnings.map((w, i) => <Text key={i} style={s.alertItem}>⚠️ {w.message.toUpperCase()}</Text>)}
            {fatigueLevel !== 'low' && <Text style={[s.alertItem, { color: COLORS.secondary }]}>🔥 FATIGUE: {fatigueLevel.toUpperCase()}</Text>}
          </View>
        )}

        {/* Summary Modal (ReplicaFit Style) */}
        {summary && (
          <View style={s.summaryModal}>
            <Text style={s.sumHeader}>SESSION COMPLETE</Text>
            <View style={s.sumGrid}>
              <SumItem label="FORM SCORE" val={`${summary.formScore}%`} color={COLORS.primaryContainer} />
              <SumItem label="TOTAL REPS" val={summary.totalReps} />
              <SumItem label="CALORIES" val={`${summary.intensity.calories} kcal`} />
            </View>
            <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate('HomeDashboard')}>
              <Text style={s.doneText}>BACK TO HQ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Controls */}
        <View style={s.mainActions}>
          {!isActive ? (
            <TouchableOpacity style={s.startExplosive} onPress={startWorkout} disabled={modelLoading}>
              <Text style={s.startExplosiveText}>START EXPLOSIVE SESSION</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.stopExplosive} onPress={stopWorkout}>
              <Text style={s.stopExplosiveText}>FINISH & ANALYZE</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SumItem({ label, val, color = '#fff' }) {
  return (
    <View style={s.sumItem}>
      <Text style={s.sumLabel}>{label}</Text>
      <Text style={[s.sumVal, { color }]}>{val}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hudHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : SPACING.lg,
    backgroundColor: COLORS.background 
  },
  hudName: { color: COLORS.textPrimary, fontWeight: '900', letterSpacing: 1 },
  hudAction: { color: COLORS.primaryContainer, fontWeight: '700', fontSize: 12 },

  cameraWrapper: { width: SCREEN_WIDTH, height: CAMERA_HEIGHT, backgroundColor: '#000', overflow: 'hidden' },
  camera: { ...StyleSheet.absoluteFillObject },
  idleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  idleText: { color: COLORS.primaryContainer, fontWeight: '900', fontSize: FONT.sizes.xl, letterSpacing: 4 },
  
  gradeBox: { 
    position: 'absolute', 
    top: 20, 
    left: 20, 
    backgroundColor: COLORS.primaryContainer, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: RADIUS.md,
    alignItems: 'center',
    zIndex: 20
  },
  gradeLabel: { fontSize: 8, fontWeight: '900', color: COLORS.background },
  gradeValue: { fontSize: 28, fontWeight: '900', color: COLORS.background, marginTop: -4 },

  metricsOverlay: { 
    position: 'absolute', 
    bottom: 20, 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    zIndex: 20
  },
  metricGlass: { 
    backgroundColor: 'rgba(26,26,26,0.85)', 
    width: (SCREEN_WIDTH - 60) / 3, 
    padding: SPACING.md, 
    borderRadius: RADIUS.xl, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  metricVal: { fontSize: 20, fontWeight: '900', color: '#fff' },
  metricLabel: { fontSize: 8, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },

  feedbackPill: { 
    position: 'absolute', 
    top: 20, 
    right: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 20
  },
  pillText: { fontSize: 10, fontWeight: '900', color: COLORS.primaryContainer, letterSpacing: 1 },

  controlsScroll: { flex: 1, padding: SPACING.xl },
  alertBox: { backgroundColor: 'rgba(255,115,81,0.1)', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.error },
  alertItem: { fontSize: 12, fontWeight: '800', color: COLORS.error, marginBottom: 4 },

  summaryModal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.xxl, borderWidth: 2, borderColor: COLORS.primaryContainer },
  sumHeader: { fontSize: 18, fontWeight: '900', color: COLORS.primaryContainer, letterSpacing: 2, marginBottom: SPACING.xl, textAlign: 'center' },
  sumGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xxl },
  sumItem: { alignItems: 'center' },
  sumLabel: { fontSize: 8, color: COLORS.textMuted, fontWeight: '700', marginBottom: 4 },
  sumVal: { fontSize: 18, fontWeight: '900' },
  doneBtn: { backgroundColor: '#fff', padding: SPACING.lg, borderRadius: RADIUS.round, alignItems: 'center' },
  doneText: { color: '#000', fontWeight: '900', letterSpacing: 1 },

  mainActions: { gap: SPACING.lg },
  startExplosive: { 
    backgroundColor: COLORS.primaryContainer, 
    padding: SPACING.xl, 
    borderRadius: RADIUS.round, 
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.primaryContainer,
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  startExplosiveText: { color: COLORS.background, fontWeight: '900', letterSpacing: 1 },
  stopExplosive: { 
    backgroundColor: COLORS.error, 
    padding: SPACING.xl, 
    borderRadius: RADIUS.round, 
    alignItems: 'center' 
  },
  stopExplosiveText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },

  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  permTitle: { fontSize: FONT.sizes.xl, fontWeight: '900', color: COLORS.primaryContainer, letterSpacing: 2, marginBottom: SPACING.xl, textAlign: 'center' },
  startBtn: { backgroundColor: COLORS.primaryContainer, padding: SPACING.lg, borderRadius: RADIUS.round, paddingHorizontal: SPACING.xl },
  startBtnText: { color: COLORS.background, fontWeight: '900' },
});
