/**
 * Strivio Workout Intensity & Calorie Engine
 * Computes estimated calories burned and intensity level
 * based on exercise type, reps, tempo, and duration.
 */

// MET values (Metabolic Equivalent of Task) for exercises
const EXERCISE_METS = {
  squats: 5.0,
  pushups: 8.0,
  lunges: 6.0,
  planks: 4.0,
  jumping_jacks: 7.0,
  default: 4.5,
};

/**
 * Calculate estimated calories burned
 * Formula: calories = MET × weight(kg) × duration(hours)
 * @param {string} exercise - exercise type
 * @param {number} durationSec - total workout duration in seconds
 * @param {number} reps - total reps completed
 * @param {number} weightKg - user body weight in kg
 * @returns {{ calories: number, intensity: string, met: number }}
 */
export const calculateIntensity = (exercise, durationSec, reps, weightKg = 70) => {
  const met = EXERCISE_METS[exercise] || EXERCISE_METS.default;
  const durationHours = durationSec / 3600;

  // Base calorie calculation using MET
  let calories = met * weightKg * durationHours;

  // Bonus for high rep count (intensity multiplier)
  const repsPerMin = durationSec > 0 ? (reps / (durationSec / 60)) : 0;
  if (repsPerMin > 15) calories *= 1.2; // High intensity bonus
  else if (repsPerMin > 10) calories *= 1.1;

  // Determine intensity level
  let intensity = 'Low';
  if (repsPerMin > 15 || met >= 7) intensity = 'High';
  else if (repsPerMin > 8 || met >= 5) intensity = 'Moderate';

  return {
    calories: Math.round(calories),
    intensity,
    met,
    repsPerMin: parseFloat(repsPerMin.toFixed(1)),
  };
};
