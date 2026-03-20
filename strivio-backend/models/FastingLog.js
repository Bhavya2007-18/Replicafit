const mongoose = require('mongoose');

const fastingLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  targetDurationHours: { type: Number, default: 16 },
  status: { type: String, enum: ['ongoing', 'completed', 'failed'], default: 'ongoing' },
  moodId: { type: mongoose.Schema.Types.ObjectId, ref: 'MoodLog' }
}, { timestamps: true });

fastingLogSchema.index({ user: 1, startTime: -1 });

module.exports = mongoose.model('FastingLog', fastingLogSchema);
