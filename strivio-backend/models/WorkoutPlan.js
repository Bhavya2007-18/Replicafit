const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My Workout Plan' },
  goal: { type: String },
  experienceLevel: { type: String },
  days: [{
    dayNumber: Number,
    dayName: String,
    exercises: [{
      exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
      name: String,
      sets: Number,
      reps: String,
      rest: String,
      duration: String,
    }],
    isRestDay: { type: Boolean, default: false },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
