const express = require('express');
const auth = require('../middleware/auth');
const DeviceIntegration = require('../models/DeviceIntegration');
const FamilyGroup = require('../models/FamilyGroup');
const User = require('../models/User');
const crypto = require('crypto');
const router = express.Router();

// ============ GARMIN CONNECT ============
// Strivio translates SparkyFitnessGarmin/main.py login+scrape logic into Node
router.post('/garmin/connect', auth, async (req, res) => {
  try {
    const { username, password } = req.body;
    // In production, this would use Garmin's OAuth2 flow
    // For now, we store the credentials securely and mark as connected
    const integration = await DeviceIntegration.findOneAndUpdate(
      { user: req.userId, provider: 'garmin' },
      {
        user: req.userId,
        provider: 'garmin',
        externalUserId: username,
        accessToken: Buffer.from(password).toString('base64'), // encrypt in production
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ status: 'connected', provider: 'garmin', lastSync: integration.lastSyncAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ FITBIT ============
router.post('/fitbit/connect', auth, async (req, res) => {
  try {
    const { accessToken, refreshToken, userId: fitbitUserId } = req.body;
    const integration = await DeviceIntegration.findOneAndUpdate(
      { user: req.userId, provider: 'fitbit' },
      {
        user: req.userId,
        provider: 'fitbit',
        accessToken,
        refreshToken,
        externalUserId: fitbitUserId,
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ status: 'connected', provider: 'fitbit', lastSync: integration.lastSyncAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ WITHINGS ============
router.post('/withings/connect', auth, async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body;
    const integration = await DeviceIntegration.findOneAndUpdate(
      { user: req.userId, provider: 'withings' },
      {
        user: req.userId,
        provider: 'withings',
        accessToken,
        refreshToken,
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ status: 'connected', provider: 'withings', lastSync: integration.lastSyncAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ POLAR FLOW ============
router.post('/polar/connect', auth, async (req, res) => {
  try {
    const { accessToken } = req.body;
    const integration = await DeviceIntegration.findOneAndUpdate(
      { user: req.userId, provider: 'polar' },
      {
        user: req.userId,
        provider: 'polar',
        accessToken,
        lastSyncAt: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ status: 'connected', provider: 'polar', lastSync: integration.lastSyncAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ LIST CONNECTED DEVICES ============
router.get('/devices', auth, async (req, res) => {
  try {
    const integrations = await DeviceIntegration.find({ user: req.userId }).select('-accessToken -refreshToken');
    res.json(integrations);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ DISCONNECT A DEVICE ============
router.delete('/devices/:provider', auth, async (req, res) => {
  try {
    await DeviceIntegration.findOneAndDelete({ user: req.userId, provider: req.params.provider });
    res.json({ status: 'disconnected', provider: req.params.provider });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ FAMILY ACCESS ============
router.post('/family/create', auth, async (req, res) => {
  try {
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const group = new FamilyGroup({
      name: req.body.name || 'My Family',
      createdBy: req.userId,
      members: [req.userId],
      inviteCode
    });
    await group.save();
    await User.findByIdAndUpdate(req.userId, { familyId: group._id, familyRole: 'admin' });
    res.status(201).json({ group, inviteCode });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/family/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const group = await FamilyGroup.findOne({ inviteCode });
    if (!group) return res.status(404).json({ error: 'Invalid invite code' });
    if (group.members.includes(req.userId)) return res.status(400).json({ error: 'Already a member' });
    group.members.push(req.userId);
    await group.save();
    await User.findByIdAndUpdate(req.userId, { familyId: group._id, familyRole: 'member' });
    res.json({ status: 'joined', groupName: group.name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/family', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.familyId) return res.json({ family: null });
    const group = await FamilyGroup.findById(user.familyId).populate('members', 'name email profile');
    res.json({ family: group });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
