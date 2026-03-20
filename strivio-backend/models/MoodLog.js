const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now, required: true },
  moodScore: { type: Number, min: 1, max: 10, required: true },
  energyLevel: { type: Number, min: 1, max: 10 },
  stressLevel: { type: Number, min: 1, max: 10 },
  tags: [{ type: String }],
  notes: { type: String }
}, { timestamps: true });

moodLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('MoodLog', moodLogSchema);
