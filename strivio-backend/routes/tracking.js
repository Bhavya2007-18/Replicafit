const express = require('express');
const auth = require('../middleware/auth');
const BodyMeasurement = require('../models/BodyMeasurement');
const SleepSession = require('../models/SleepSession');
const MoodLog = require('../models/MoodLog');
const FastingLog = require('../models/FastingLog');
const HydrationLog = require('../models/HydrationLog');
const { searchFood } = require('../services/foodDatabaseService');
const router = express.Router();

// ============ BODY MEASUREMENTS ============
router.get('/body-measurements', auth, async (req, res) => {
  try {
    const records = await BodyMeasurement.find({ user: req.userId }).sort({ date: -1 }).limit(90);
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/body-measurements', auth, async (req, res) => {
  try {
    const record = new BodyMeasurement({ user: req.userId, ...req.body });
    await record.save();
    res.status(201).json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ SLEEP SESSIONS ============
router.get('/sleep', auth, async (req, res) => {
  try {
    const records = await SleepSession.find({ user: req.userId }).sort({ startTime: -1 }).limit(30);
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sleep', auth, async (req, res) => {
  try {
    const session = new SleepSession({ user: req.userId, ...req.body });
    session.durationMinutes = Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000);
    await session.save();
    res.status(201).json(session);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ MOOD LOGS ============
router.get('/mood', auth, async (req, res) => {
  try {
    const records = await MoodLog.find({ user: req.userId }).sort({ date: -1 }).limit(30);
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mood', auth, async (req, res) => {
  try {
    const log = new MoodLog({ user: req.userId, ...req.body });
    await log.save();
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ FASTING LOGS ============
router.get('/fasting', auth, async (req, res) => {
  try {
    const records = await FastingLog.find({ user: req.userId }).sort({ startTime: -1 }).limit(30);
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fasting/start', auth, async (req, res) => {
  try {
    const log = new FastingLog({ user: req.userId, startTime: new Date(), targetDurationHours: req.body.targetHours || 16 });
    await log.save();
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/fasting/:id/end', auth, async (req, res) => {
  try {
    const log = await FastingLog.findOne({ _id: req.params.id, user: req.userId });
    if (!log) return res.status(404).json({ error: 'Fasting session not found' });
    log.endTime = new Date();
    const hoursElapsed = (log.endTime - log.startTime) / 3600000;
    log.status = hoursElapsed >= log.targetDurationHours ? 'completed' : 'failed';
    await log.save();
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ HYDRATION LOGS ============
router.get('/hydration', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await HydrationLog.find({ user: req.userId, date: { $gte: today } }).sort({ date: -1 });
    const totalMl = records.reduce((sum, r) => sum + r.amountMl, 0);
    res.json({ records, totalMl, goalMl: 3000 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/hydration', auth, async (req, res) => {
  try {
    const log = new HydrationLog({ user: req.userId, ...req.body });
    await log.save();
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ FOOD SEARCH (OpenFoodFacts + USDA) ============
router.get('/food-search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    const results = await searchFood(q);
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ GOALS ============
router.get('/daily-checkin', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [mood, hydration, sleep, fasting, bodyM] = await Promise.all([
      MoodLog.findOne({ user: req.userId, date: { $gte: today, $lt: tomorrow } }),
      HydrationLog.find({ user: req.userId, date: { $gte: today } }),
      SleepSession.findOne({ user: req.userId, endTime: { $gte: today } }).sort({ endTime: -1 }),
      FastingLog.findOne({ user: req.userId, startTime: { $gte: today } }).sort({ startTime: -1 }),
      BodyMeasurement.findOne({ user: req.userId }).sort({ date: -1 })
    ]);

    res.json({
      mood: mood ? { score: mood.moodScore, energy: mood.energyLevel } : null,
      hydration: { totalMl: hydration.reduce((s, r) => s + r.amountMl, 0), goalMl: 3000 },
      sleep: sleep ? { duration: sleep.durationMinutes, quality: sleep.qualityScore } : null,
      fasting: fasting ? { status: fasting.status, target: fasting.targetDurationHours } : null,
      latestWeight: bodyM?.weight || null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
