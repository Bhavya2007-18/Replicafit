import { exerciseDatabase } from '../data/exerciseDatabase';

export const defineWorkoutPlan = (profile) => {
  // Extract inputs
  const { goal, experienceLevel } = profile; 
  // goal: 'fat_loss', 'muscle_gain', 'endurance'
  // experienceLevel: 'Beginner', 'Intermediate', 'Advanced'

  // Filter exercises by difficulty
  let availableExercises = exerciseDatabase;
  if (experienceLevel === 'Beginner') {
      availableExercises = exerciseDatabase.filter(e => e.difficulty === 'Beginner');
  } else if (experienceLevel === 'Intermediate') {
      availableExercises = exerciseDatabase.filter(e => e.difficulty !== 'Advanced');
  }

  // Define logic based on goal
  let repRange = { sets: 3, reps: '10-12' };
  let restTime = '60s';

  if (goal === 'muscle_gain') {
      repRange = { sets: 4, reps: '8-10' };
      restTime = '90s';
  } else if (goal === 'endurance') {
      repRange = { sets: 3, reps: '15-20' };
      restTime = '45s';
  } else if (goal === 'fat_loss') {
      repRange = { sets: 4, reps: '12-15' };
      restTime = '30s';
  }

  // Shuffle and split exercises for two days (Simple Algorithm)
  const shuffled = availableExercises.sort(() => 0.5 - Math.random());
  const half = Math.ceil(shuffled.length / 2);    
  const day1 = shuffled.slice(0, half).map(ex => ({
      exercise: ex.name,
      ...repRange,
      rest: restTime
  }));
  const day2 = shuffled.slice(half).map(ex => ({
      exercise: ex.name,
      ...repRange,
      rest: restTime
  }));

  return {
      day1: day1,
      day2: day2,
      notes: `Targeting ${goal.replace('_', ' ')} for an ${experienceLevel}`
  };
};
