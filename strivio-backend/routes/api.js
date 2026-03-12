const express = require('express');
const auth = require('../middleware/auth');
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutSession = require('../models/WorkoutSession');
const Exercise = require('../models/Exercise');
const User = require('../models/User');
const { Achievement, NutritionLog, Challenge } = require('../models/Other');
const router = express.Router();

// ============ EXERCISES ============
router.get('/exercises', async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/exercises/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ error: 'Not found' });
    res.json(exercise);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ WORKOUT PLANS ============
router.get('/workout-plans', auth, async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workout-plans', auth, async (req, res) => {
  try {
    const plan = new WorkoutPlan({ userId: req.userId, ...req.body });
    await plan.save();
    res.status(201).json(plan);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ WORKOUT SESSIONS ============
router.get('/workout-sessions', auth, async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(50);
    res.json(sessions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workout-sessions', auth, async (req, res) => {
  try {
    const session = new WorkoutSession({ userId: req.userId, ...req.body });
    await session.save();

    // Update user streak and XP
    const user = await User.findById(req.userId);
    const today = new Date().toDateString();
    const lastDate = user.lastWorkoutDate ? new Date(user.lastWorkoutDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastDate === yesterday) {
      user.streak += 1;
    } else if (lastDate !== today) {
      user.streak = 1;
    }
    user.lastWorkoutDate = new Date();
    user.xp += Math.round(session.totalAccuracy * 0.5 + session.totalDuration * 0.1);
    user.level = Math.floor(user.xp / 500) + 1;
    await user.save();

    res.status(201).json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ PROGRESS ============
router.get('/progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const sessions = await WorkoutSession.find({ userId: req.userId });
    const totalWorkouts = sessions.length;
    const avgAccuracy = totalWorkouts > 0 ? Math.round(sessions.reduce((s, w) => s + w.totalAccuracy, 0) / totalWorkouts) : 0;
    const totalCalories = sessions.reduce((s, w) => s + w.totalCalories, 0);
    const totalDuration = sessions.reduce((s, w) => s + w.totalDuration, 0);

    res.json({
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      totalWorkouts,
      avgAccuracy,
      totalCalories,
      totalDuration,
      weeklyData: sessions.slice(0, 7).map(s => ({ date: s.completedAt, accuracy: s.totalAccuracy })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ ACHIEVEMENTS ============
router.get('/achievements', auth, async (req, res) => {
  try {
    let achievements = await Achievement.find({ userId: req.userId });
    if (achievements.length === 0) {
      // Seed default achievements
      const defaults = [
        { userId: req.userId, title: 'First Workout', description: 'Complete your first workout session', icon: '🎯', xpReward: 50, progress: { current: 0, target: 1 } },
        { userId: req.userId, title: 'Week Warrior', description: 'Complete 5 workouts in a week', icon: '⚡', xpReward: 100, progress: { current: 0, target: 5 } },
        { userId: req.userId, title: 'Form Master', description: 'Achieve 95%+ accuracy on any exercise', icon: '🏅', xpReward: 150, progress: { current: 0, target: 1 } },
        { userId: req.userId, title: 'Iron Will', description: 'Complete 30 consecutive workout days', icon: '🔥', xpReward: 500, progress: { current: 0, target: 30 } },
      ];
      achievements = await Achievement.insertMany(defaults);
    }
    res.json(achievements);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ NUTRITION ============
router.get('/nutrition-logs', auth, async (req, res) => {
  try {
    const logs = await NutritionLog.find({ userId: req.userId }).sort({ date: -1 }).limit(30);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/nutrition-logs', auth, async (req, res) => {
  try {
    const log = new NutritionLog({ userId: req.userId, ...req.body });
    await log.save();
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ CHALLENGES ============
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find().populate('participants.userId', 'name');
    res.json(challenges);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/challenges/:id/join', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    const already = challenge.participants.find(p => p.userId.toString() === req.userId);
    if (already) return res.status(400).json({ error: 'Already joined' });
    challenge.participants.push({ userId: req.userId });
    await challenge.save();
    res.json(challenge);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ AI INSIGHTS ============
router.get('/ai-insights', auth, async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(14);
    const insights = [];

    if (sessions.length >= 2) {
      const recent = sessions.slice(0, 7);
      const older = sessions.slice(7, 14);
      const recentAvg = recent.reduce((s, w) => s + w.totalAccuracy, 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((s, w) => s + w.totalAccuracy, 0) / older.length : recentAvg;

      if (recentAvg > olderAvg) {
        insights.push({ type: 'positive', message: `Your accuracy improved by ${Math.round(recentAvg - olderAvg)}% this week! Keep it up.` });
      } else if (recentAvg < olderAvg) {
        insights.push({ type: 'warning', message: `Your accuracy dropped by ${Math.round(olderAvg - recentAvg)}%. Focus on form during your next session.` });
      }

      if (recent.length >= 5) {
        insights.push({ type: 'positive', message: 'Great consistency! You completed 5+ workouts this week.' });
      }
    }

    if (sessions.length === 0) {
      insights.push({ type: 'info', message: 'Start your first workout to begin receiving AI coaching insights!' });
    }

    res.json(insights);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
