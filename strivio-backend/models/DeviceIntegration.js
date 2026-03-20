const mongoose = require('mongoose');

const deviceIntegrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { 
    type: String, 
    enum: ['garmin', 'fitbit', 'withings', 'apple_health', 'google_fit', 'polar', 'hevy'], 
    required: true 
  },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  externalUserId: { type: String },
  syncSettings: {
    syncWorkouts: { type: Boolean, default: true },
    syncSleep: { type: Boolean, default: true },
    syncVitals: { type: Boolean, default: true }
  },
  lastSyncAt: { type: Date }
}, { timestamps: true });

deviceIntegrationSchema.index({ user: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('DeviceIntegration', deviceIntegrationSchema);
