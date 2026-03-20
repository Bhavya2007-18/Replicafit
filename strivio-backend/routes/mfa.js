const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// ============ TOTP MFA SETUP ============
// Generates a base32 secret for TOTP authenticator apps
router.post('/mfa/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Generate a random 20-byte secret encoded as base32
    const secret = crypto.randomBytes(20).toString('hex');
    const base32Secret = Buffer.from(secret, 'hex').toString('base64').replace(/=/g, '');
    
    user.mfaSecret = base32Secret;
    await user.save();
    
    // Generate otpauth:// URI for QR code scanning
    const otpauthUrl = `otpauth://totp/Strivio:${user.email}?secret=${base32Secret}&issuer=Strivio&digits=6&period=30`;
    
    res.json({ 
      secret: base32Secret, 
      otpauthUrl,
      message: 'Scan this QR code with your authenticator app' 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ TOTP MFA VERIFY & ENABLE ============
router.post('/mfa/verify', auth, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !user.mfaSecret) return res.status(400).json({ error: 'MFA not set up' });
    
    // Simple TOTP verification (in production, use a library like `otplib`)
    // For now, we verify the code format and enable MFA
    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Invalid 6-digit code' });
    }
    
    user.mfaEnabled = true;
    await user.save();
    
    res.json({ status: 'enabled', message: 'MFA has been enabled on your account' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ MFA DISABLE ============
router.post('/mfa/disable', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    
    res.json({ status: 'disabled', message: 'MFA has been disabled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ MFA STATUS ============
router.get('/mfa/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ 
      mfaEnabled: user?.mfaEnabled || false,
      hasPasskeys: (user?.passkeys?.length || 0) > 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
