const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  targetMuscles: [String],
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  instructions: [String],
  commonMistakes: [String],
  imageUrl: String,
  category: { type: String, enum: ['strength', 'cardio', 'flexibility', 'balance'] },
}, { timestamps: true });

module.exports = mongoose.model('Exercise', exerciseSchema);
