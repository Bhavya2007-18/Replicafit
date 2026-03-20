const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Use in-memory MongoDB if no external MongoDB is available
    if (process.env.USE_MEMORY_DB === 'true') {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('Using in-memory MongoDB at:', uri);
    }

    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');

    // Auto-seed exercises if empty
    const Exercise = require('../models/Exercise');
    const count = await Exercise.countDocuments();
    if (count === 0) {
      console.log('Auto-seeding exercises...');
      await Exercise.insertMany([
        { name: 'Squats', targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'], difficulty: 'Beginner', category: 'strength', instructions: ['Stand with feet shoulder-width apart.', 'Bend knees, lower hips as if sitting.', 'Go down until thighs are parallel to floor.', 'Push through heels to return up.'], commonMistakes: ['Knees caving inwards.', 'Rounding lower back.', 'Lifting heels off ground.'] },
        { name: 'Pushups', targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'], difficulty: 'Intermediate', category: 'strength', instructions: ['Start in high plank, hands wider than shoulders.', 'Keep body in straight line.', 'Lower chest nearly to floor.', 'Push back up.'], commonMistakes: ['Sagging hips.', 'Flaring elbows too wide.', 'Not going down far enough.'] },
        { name: 'Lunges', targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'], difficulty: 'Beginner', category: 'strength', instructions: ['Stand tall, feet hip-width.', 'Step forward with right leg.', 'Lower until thigh is parallel.', 'Push off to return.'], commonMistakes: ['Front knee past toes.', 'Leaning torso forward.', 'Step too short.'] },
        { name: 'Pullups', targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Upper Back', 'Core'], difficulty: 'Advanced', category: 'strength', instructions: ['Grip bar, palms away.', 'Hang with arms extended.', 'Pull up until chin clears bar.', 'Lower with control.'], commonMistakes: ['Using momentum.', 'Incomplete range of motion.', 'Shoulders shrugging.'] },
        { name: 'Plank', targetMuscles: ['Core', 'Shoulders', 'Back'], difficulty: 'Beginner', category: 'strength', instructions: ['Start on forearms and toes.', 'Elbows under shoulders.', 'Straight line head to heels.', 'Hold while bracing core.'], commonMistakes: ['Hips too high.', 'Hips sagging.', 'Straining neck.'] },
        { name: 'Leg Raises', targetMuscles: ['Lower Abs', 'Hip Flexors'], difficulty: 'Intermediate', category: 'strength', instructions: ['Lie flat, legs straight.', 'Arms by sides.', 'Lift legs to ceiling.', 'Lower without touching floor.'], commonMistakes: ['Arching lower back.', 'Using momentum.', 'Bending knees.'] },
        { name: 'Bicep Curls', targetMuscles: ['Biceps', 'Forearms'], difficulty: 'Beginner', category: 'strength', instructions: ['Stand tall holding dumbbells.', 'Keep elbows tucked tightly.', 'Curl the weights upward.', 'Slowly lower back down.'], commonMistakes: ['Swinging the torso.', 'Moving elbows forward.', 'Not extending fully.'] },
      ]);

      const { Challenge } = require('../models/Other');
      await Challenge.insertMany([
        { title: '30-Day Plank Challenge', description: 'Hold a plank every day for 30 days.', type: 'endurance', icon: '💪', startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000) },
        { title: '10K Daily Steps', description: 'Walk 10,000 steps every day for two weeks.', type: 'cardio', icon: '🏃', startDate: new Date(), endDate: new Date(Date.now() + 14 * 86400000) },
        { title: 'Pushup Mastery', description: 'Complete 1000 total pushups in 30 days.', type: 'strength', icon: '🏆', startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000) },
      ]);
      console.log('Seed complete: 7 exercises, 3 challenges');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
