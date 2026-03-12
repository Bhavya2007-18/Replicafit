import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, RADIUS, FONT } from '../theme/colors';
import SkeletonOverlay from '../components/SkeletonOverlay';
import { initializePoseDetection, detectPose, disposePoseDetection } from '../services/poseDetectionService';
import { classifyExercise, resetClassifier, getExerciseDisplayName } from '../services/exerciseClassifier';
import { analyzeForm, detectRep, getSessionSummary, resetFormAnalyzer } from '../services/formAnalyzer';
import { detectInjuryRisks } from '../services/injuryDetection';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_WIDTH * 1.33; // 4:3 aspect ratio

export default function GuidedWorkoutScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState('front');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);

  // Tracking state
  const [keypoints, setKeypoints] = useState([]);
  const [exercise, setExercise] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in frame');
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [summary, setSummary] = useState(null);
  const [injuryWarnings, setInjuryWarnings] = useState([]);

  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const analysisRef = useRef(null);
  const isActiveRef = useRef(false);

  // Initialize pose detection model
  const loadModel = useCallback(async () => {
    if (modelLoaded || modelLoading) return;
    setModelLoading(true);
    setFeedback('Loading AI model...');
    const detector = await initializePoseDetection();
    if (detector) {
      setModelLoaded(true);
      setFeedback('AI model ready. Tap Start to begin!');
    } else {
      setFeedback('AI model failed to load. Using demo mode.');
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

  // Start workout
  const startWorkout = () => {
    setIsActive(true);
    isActiveRef.current = true;
    setReps(0);
    setAccuracy(0);
    setTime(0);
    setExercise(null);
    setFeedback('Analyzing your movement...');
    setSessionSaved(false);
    setSummary(null);
    resetClassifier();
    resetFormAnalyzer();

    // Timer
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);

    // Analysis loop — process frames at ~5-10 FPS
    startAnalysisLoop();
  };

  // Camera frame analysis loop
  const startAnalysisLoop = () => {
    analysisRef.current = setInterval(async () => {
      if (!isActiveRef.current || !cameraRef.current) return;

      try {
        // Capture a frame from camera
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          skipProcessing: true,
          base64: false,
        });

        if (!photo) return;

        // Run pose detection
        const { keypoints: kps, isReliable, avgConfidence } = await detectPose(photo);

        if (kps.length > 0) {
          setKeypoints(kps);

          // Auto-classify exercise
          const classification = classifyExercise(kps);
          if (classification.exercise) {
            setExercise(classification.exercise);
          }

          // Analyze form
          const formResult = analyzeForm(kps, classification.exercise, isReliable);
          setAccuracy(formResult.accuracy);
          setIsPaused(formResult.isPaused);

          if (formResult.feedback && formResult.feedback.length > 0) {
            setFeedback(formResult.feedback[0]);
          }

          // Detect reps
          if (formResult.angles && classification.exercise) {
            const repResult = detectRep(formResult.angles, classification.exercise);
            setReps(repResult.reps);
          }

          // Injury risk detection
          const risks = detectInjuryRisks(kps, classification.exercise);
          setInjuryWarnings(risks);
        } else if (!isReliable) {
          setFeedback('Please step fully into the camera frame.');
          setIsPaused(true);
        }
      } catch (e) {
        // Frame processing failed, continue to next frame
      }
    }, 200); // ~5 FPS analysis
  };

  // Stop workout
  const stopWorkout = async () => {
    setIsActive(false);
    isActiveRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisRef.current) clearInterval(analysisRef.current);

    const sessionSummary = getSessionSummary();
    setSummary(sessionSummary);

    if (sessionSummary.totalReps > 0 || reps > 0) {
      const session = {
        exercises: [{
          name: getExerciseDisplayName(exercise) || 'Unknown',
          reps: sessionSummary.totalReps || reps,
          accuracyScore: sessionSummary.avgAccuracy || accuracy,
          timeSpent: time,
          caloriesBurned: Math.round((sessionSummary.totalReps || reps) * 3.5),
        }],
        totalAccuracy: sessionSummary.avgAccuracy || accuracy,
        totalDuration: time,
        totalCalories: Math.round((sessionSummary.totalReps || reps) * 3.5),
      };

      try {
        await api.saveWorkoutSession(session);
        setSessionSaved(true);
        setFeedback(`Workout saved! ${sessionSummary.totalReps || reps} reps at ${sessionSummary.avgAccuracy || accuracy}% avg accuracy.`);
      } catch (e) {
        setFeedback('Workout complete! (Save failed — check server)');
      }
    } else {
      setFeedback('No reps detected. Try a longer workout next time.');
    }
  };

  const toggleCamera = () => setFacing(f => f === 'front' ? 'back' : 'front');
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Permission handling
  if (!permission) return <View style={s.container}><Text style={s.loadText}>Loading...</Text></View>;
  if (!permission.granted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.permissionBox}>
          <Text style={s.permTitle}>Camera Permission Needed</Text>
          <Text style={s.permDesc}>Strivio needs camera access to track your exercise form in real-time using AI.</Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          {isActive && <TouchableOpacity onPress={toggleCamera}><Text style={s.flipBtn}>🔄 Flip</Text></TouchableOpacity>}
        </View>

        <Text style={s.title}>Guided Workout</Text>
        {exercise && <Text style={s.exerciseName}>{getExerciseDisplayName(exercise)}</Text>}

        {/* Camera + Skeleton */}
        <View style={s.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={s.camera}
            facing={facing}
            onCameraReady={() => setCameraReady(true)}
          />
          {isActive && keypoints.length > 0 && (
            <SkeletonOverlay
              keypoints={keypoints}
              accuracy={accuracy}
              width={SCREEN_WIDTH - SPACING.xl * 2}
              height={CAMERA_HEIGHT}
            />
          )}
          {!isActive && !summary && (
            <View style={s.cameraOverlay}>
              <Text style={s.cameraIcon}>{modelLoaded ? '📸' : '⏳'}</Text>
              <Text style={s.cameraText}>{modelLoaded ? 'Camera Ready' : 'Loading AI...'}</Text>
            </View>
          )}
          {isPaused && isActive && (
            <View style={s.pauseOverlay}>
              <Text style={s.pauseText}>⚠️ Step fully into frame</Text>
            </View>
          )}
        </View>

        {/* Live Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}><Text style={s.statValue}>{reps}</Text><Text style={s.statLabel}>Reps</Text></View>
          <View style={[s.statBox, s.statBoxAccent]}><Text style={s.statValueAccent}>{accuracy > 0 ? `${accuracy}%` : '--'}</Text><Text style={s.statLabelAccent}>Accuracy</Text></View>
          <View style={s.statBox}><Text style={s.statValue}>{formatTime(time)}</Text><Text style={s.statLabel}>Time</Text></View>
        </View>

        {/* Feedback Card */}
        <View style={s.feedbackCard}>
          <Text style={s.feedbackTitle}>AI Feedback</Text>
          <Text style={[s.feedbackText, isPaused && s.feedbackWarning]}>{feedback}</Text>
        </View>

        {/* Injury Warnings */}
        {injuryWarnings.length > 0 && isActive && (
          <View style={s.injuryCard}>
            <Text style={s.injuryTitle}>⚠️ Injury Risk Detected</Text>
            {injuryWarnings.map((w, i) => (
              <Text key={i} style={s.injuryText}>{w.icon} {w.message}</Text>
            ))}
          </View>
        )}

        {/* Session Summary */}
        {summary && (
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>Workout Summary</Text>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Total Reps</Text><Text style={s.summaryValue}>{summary.totalReps}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Avg Accuracy</Text><Text style={s.summaryValue}>{summary.avgAccuracy}%</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Best Rep</Text><Text style={s.summaryValue}>{summary.bestAccuracy}%</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Duration</Text><Text style={s.summaryValue}>{formatTime(time)}</Text></View>
          </View>
        )}

        {/* Controls */}
        {!isActive ? (
          <TouchableOpacity style={s.startBtn} onPress={startWorkout} disabled={modelLoading}>
            <Text style={s.startBtnText}>{summary ? 'Start New Workout' : modelLoading ? 'Loading AI...' : 'Start Workout'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.stopBtn} onPress={stopWorkout}>
            <Text style={s.stopBtnText}>⏹ Stop & Save</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  back: { color: COLORS.primary, fontSize: FONT.sizes.md },
  flipBtn: { color: COLORS.textSecondary, fontSize: FONT.sizes.md },
  title: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  exerciseName: { fontSize: FONT.sizes.lg, ...FONT.semibold, color: COLORS.primary, marginBottom: SPACING.lg },
  loadText: { color: COLORS.textSecondary, fontSize: FONT.sizes.md, textAlign: 'center', marginTop: 100 },

  // Camera
  cameraContainer: { width: '100%', height: CAMERA_HEIGHT, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.xl, backgroundColor: COLORS.surface, position: 'relative' },
  camera: { width: '100%', height: '100%' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  cameraIcon: { fontSize: 48, marginBottom: SPACING.md },
  cameraText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary },
  pauseOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md, backgroundColor: 'rgba(255,71,87,0.8)', alignItems: 'center' },
  pauseText: { color: '#fff', fontSize: FONT.sizes.md, ...FONT.bold },

  // Permission
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  permTitle: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },
  permDesc: { fontSize: FONT.sizes.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl },
  permBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xxxl },
  permBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  statBox: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statBoxAccent: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryMuted },
  statValue: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.textPrimary },
  statValueAccent: { fontSize: FONT.sizes.xxl, ...FONT.bold, color: COLORS.primary },
  statLabel: { fontSize: FONT.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  statLabelAccent: { fontSize: FONT.sizes.xs, color: COLORS.primary, marginTop: 4 },

  // Feedback
  feedbackCard: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  feedbackTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  feedbackText: { fontSize: FONT.sizes.md, color: COLORS.textSecondary },
  feedbackWarning: { color: COLORS.danger },

  // Injury
  injuryCard: { backgroundColor: COLORS.dangerMuted, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.danger, marginBottom: SPACING.xl },
  injuryTitle: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.danger, marginBottom: SPACING.sm },
  injuryText: { fontSize: FONT.sizes.sm, color: COLORS.textPrimary, marginBottom: SPACING.xs, lineHeight: 20 },

  // Summary
  summaryCard: { backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.md, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.primary, marginBottom: SPACING.xl },
  summaryTitle: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.primary, marginBottom: SPACING.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONT.sizes.md, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT.sizes.md, ...FONT.bold, color: COLORS.primary },

  // Controls
  startBtn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center' },
  startBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.textOnPrimary },
  stopBtn: { backgroundColor: COLORS.dangerMuted, padding: SPACING.lg, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger },
  stopBtnText: { fontSize: FONT.sizes.lg, ...FONT.bold, color: COLORS.danger },
});
