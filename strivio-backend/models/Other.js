const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  icon: String,
  xpReward: { type: Number, default: 50 },
  unlocked: { type: Boolean, default: false },
  unlockedAt: Date,
  progress: { current: Number, target: Number },
});

const nutritionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  meals: [{
    name: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  }],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  waterIntake: { type: Number, default: 0 }, // liters
});

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: String,
  icon: String,
  startDate: Date,
  endDate: Date,
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  }],
});

const Achievement = mongoose.model('Achievement', achievementSchema);
const NutritionLog = mongoose.model('NutritionLog', nutritionLogSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = { Achievement, NutritionLog, Challenge };
