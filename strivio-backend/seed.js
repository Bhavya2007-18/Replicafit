const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');
const { Challenge } = require('./models/Other');
require('dotenv').config();

const exercises = [
  { name: 'Squats', targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'], difficulty: 'Beginner', category: 'strength', instructions: ['Stand with feet shoulder-width apart.', 'Bend knees, lower hips as if sitting.', 'Go down until thighs are parallel to floor.', 'Push through heels to return up.'], commonMistakes: ['Knees caving inwards.', 'Rounding lower back.', 'Lifting heels off ground.'], tutorialUrl: 'https://www.youtube.com/watch?v=aclHkVaku9U', videoPreviewUrl: 'https://img.youtube.com/vi/aclHkVaku9U/0.jpg' },
  { name: 'Pushups', targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'], difficulty: 'Intermediate', category: 'strength', instructions: ['Start in high plank, hands wider than shoulders.', 'Keep body in straight line head to heels.', 'Lower chest nearly to floor.', 'Push back up.'], commonMistakes: ['Sagging hips.', 'Flaring elbows too wide.', 'Not going down far enough.'], tutorialUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4', videoPreviewUrl: 'https://img.youtube.com/vi/IODxDxX7oi4/0.jpg' },
  { name: 'Lunges', targetMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'], difficulty: 'Beginner', category: 'strength', instructions: ['Stand tall, feet hip-width apart.', 'Step forward with right leg.', 'Lower until right thigh is parallel to floor.', 'Push off to return. Repeat other side.'], commonMistakes: ['Front knee past toes.', 'Leaning torso too far forward.', 'Step too short.'], tutorialUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs', videoPreviewUrl: 'https://img.youtube.com/vi/L8fvypPrzzs/0.jpg' },
  { name: 'Pullups', targetMuscles: ['Latissimus Dorsi', 'Biceps', 'Upper Back', 'Core'], difficulty: 'Advanced', category: 'strength', instructions: ['Grip bar, palms away, wider than shoulders.', 'Hang with arms extended.', 'Pull up until chin clears bar.', 'Lower with control.'], commonMistakes: ['Using momentum (kipping).', 'Incomplete range of motion.', 'Shoulders shrugging to ears.'], tutorialUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', videoPreviewUrl: 'https://img.youtube.com/vi/eGo4IYlbE5g/0.jpg' },
  { name: 'Plank', targetMuscles: ['Core', 'Shoulders', 'Back'], difficulty: 'Beginner', category: 'strength', instructions: ['Start on forearms and toes.', 'Elbows under shoulders.', 'Straight line from head to heels.', 'Hold while bracing core.'], commonMistakes: ['Hips too high.', 'Hips sagging.', 'Straining neck.'], tutorialUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c', videoPreviewUrl: 'https://img.youtube.com/vi/ASdvN_XEl_c/0.jpg' },
  { name: 'Leg Raises', targetMuscles: ['Lower Abs', 'Hip Flexors'], difficulty: 'Intermediate', category: 'strength', instructions: ['Lie flat, legs straight together.', 'Arms by sides or under lower back.', 'Lift legs to ceiling, keep straight.', 'Lower without touching floor.'], commonMistakes: ['Arching lower back.', 'Using momentum.', 'Bending knees.'], tutorialUrl: 'https://www.youtube.com/watch?v=2MEwQgzTIZc', videoPreviewUrl: 'https://img.youtube.com/vi/2MEwQgzTIZc/0.jpg' },
  { name: 'Bicep Curls', targetMuscles: ['Biceps', 'Forearms'], difficulty: 'Beginner', category: 'strength', instructions: ['Stand tall holding dumbbells by sides.', 'Keep chest up and elbows tucked.', 'Curl weights upward.', 'Slowly lower back to extension.'], commonMistakes: ['Swinging the torso.', 'Moving elbows forward.', 'Not fully extending arms at bottom.'], tutorialUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', videoPreviewUrl: 'https://img.youtube.com/vi/ykJmrZ5v0Oo/0.jpg' },
];

const challenges = [
  { title: '30-Day Plank Challenge', description: 'Hold a plank every day for 30 days, increasing duration weekly.', type: 'endurance', icon: '💪', startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000) },
  { title: '10K Daily Steps', description: 'Walk or run 10,000 steps every day for two weeks.', type: 'cardio', icon: '🏃', startDate: new Date(), endDate: new Date(Date.now() + 14 * 86400000) },
  { title: 'Pushup Mastery', description: 'Complete 1000 total pushups in 30 days.', type: 'strength', icon: '🏆', startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000) },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await Exercise.deleteMany({});
  await Exercise.insertMany(exercises);
  console.log(`Seeded ${exercises.length} exercises`);

  await Challenge.deleteMany({});
  await Challenge.insertMany(challenges);
  console.log(`Seeded ${challenges.length} challenges`);

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch(console.error);
