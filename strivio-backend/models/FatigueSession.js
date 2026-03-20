const mongoose = require('mongoose');

const FatigueSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  hr: { type: Number, default: 0 },
  hrv: { type: Number, default: 0 },
  repSpeed: { type: Number, default: 0 },
  rom: { type: Number, default: 0 },
  fatigueScore: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  exerciseId: { type: String, default: null },
  exerciseName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FatigueSession', FatigueSessionSchema);
