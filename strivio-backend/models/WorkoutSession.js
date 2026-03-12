const mongoose = require('mongoose');

const workoutSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercises: [{
    name: String,
    reps: Number,
    accuracyScore: Number,
    timeSpent: Number, // seconds
    caloriesBurned: Number,
    poseData: [{ type: mongoose.Schema.Types.Mixed }], // for AI replay
  }],
  totalAccuracy: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // seconds
  totalCalories: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
