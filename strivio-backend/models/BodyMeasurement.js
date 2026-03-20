const mongoose = require('mongoose');

const bodyMeasurementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  weight: { type: Number }, // in kg
  height: { type: Number }, // in cm
  bodyFatPercentage: { type: Number },
  muscleMass: { type: Number }, // in kg
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    leftArm: Number,
    rightArm: Number,
    leftThigh: Number,
    rightThigh: Number,
    calves: Number
  },
  source: { type: String, enum: ['manual', 'apple_health', 'google_fit', 'garmin', 'withings', 'fitbit'], default: 'manual' }
}, { timestamps: true });

bodyMeasurementSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('BodyMeasurement', bodyMeasurementSchema);
