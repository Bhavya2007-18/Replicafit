const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  profile: {
    age: { type: Number, default: 25 },
    height: { type: Number, default: 170 },
    weight: { type: Number, default: 70 },
    goal: { type: String, enum: ['fat_loss', 'muscle_gain', 'endurance', 'strength', 'mobility'], default: 'muscle_gain' },
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], default: 'moderate' },
    equipment: { type: [String], default: ['bodyweight'] },
  },
  onboardingComplete: { type: Boolean, default: false },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastWorkoutDate: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
