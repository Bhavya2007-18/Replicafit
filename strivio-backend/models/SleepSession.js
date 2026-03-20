const mongoose = require('mongoose');

const sleepSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationMinutes: { type: Number },
  qualityScore: { type: Number, min: 0, max: 100 },
  stages: [{
    stage: { type: String, enum: ['awake', 'rem', 'light', 'deep'] },
    startTime: Date,
    endTime: Date
  }],
  source: { type: String, enum: ['manual', 'apple_health', 'google_fit', 'garmin', 'fitbit', 'withings'], default: 'manual' }
}, { timestamps: true });

sleepSessionSchema.index({ user: 1, startTime: -1 });

module.exports = mongoose.model('SleepSession', sleepSessionSchema);
