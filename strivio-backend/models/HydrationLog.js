const mongoose = require('mongoose');

const hydrationLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now, required: true },
  amountMl: { type: Number, required: true },
  beverageType: { type: String, enum: ['water', 'coffee', 'tea', 'protein_shake', 'other'], default: 'water' },
}, { timestamps: true });

hydrationLogSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('HydrationLog', hydrationLogSchema);
