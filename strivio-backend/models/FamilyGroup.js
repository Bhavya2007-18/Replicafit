const mongoose = require('mongoose');

const familyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    shareWorkouts: { type: Boolean, default: true },
    shareNutrition: { type: Boolean, default: false }
  },
  inviteCode: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('FamilyGroup', familyGroupSchema);
