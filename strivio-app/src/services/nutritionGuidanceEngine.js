/**
 * Strivio Smart Nutrition Guidance Engine
 */

export const FOOD_DATABASE = [
  { name: 'Paneer (100g)', protein: 18, carbs: 4, fat: 20, calories: 265, tags: ['high_protein', 'veg', 'indian'] },
  { name: 'Chicken Breast (150g)', protein: 46, carbs: 0, fat: 5, calories: 247, tags: ['high_protein', 'non_veg', 'low_carb'] },
  { name: 'Dal Tadka (1 bowl)', protein: 8, carbs: 25, fat: 6, calories: 180, tags: ['veg', 'indian', 'moderate_protein'] },
  { name: 'Boiled Egg (2)', protein: 12, carbs: 1, fat: 10, calories: 140, tags: ['high_protein', 'quick', 'non_veg'] },
  { name: 'Greek Yogurt (170g)', protein: 17, carbs: 6, fat: 0, calories: 100, tags: ['high_protein', 'quick', 'veg'] },
  { name: 'Oats with Milk (1 bowl)', protein: 12, carbs: 40, fat: 8, calories: 300, tags: ['high_carb', 'veg', 'breakfast'] },
  { name: 'Soya Chunks (50g)', protein: 26, carbs: 16, fat: 1, calories: 170, tags: ['high_protein', 'veg', 'indian'] },
  { name: 'Mixed Nuts (30g)', protein: 6, carbs: 6, fat: 15, calories: 180, tags: ['quick', 'veg', 'calorie_dense'] },
  { name: 'Whey Protein (1 scoop)', protein: 24, carbs: 2, fat: 1, calories: 120, tags: ['high_protein', 'quick'] },
  { name: 'Roti (2)', protein: 6, carbs: 30, fat: 1, calories: 160, tags: ['veg', 'indian', 'moderate_carb'] },
];

export const getDailyTargets = (profile) => {
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 25;
  const goal = profile.goal || 'maintenance';

  // Mifflin-St Jeor Equation
  let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  let tdee = bmr * 1.5; // Moderate activity multiplier

  let calTarget = tdee;
  let proteinRatio = 0.25; // % of calories
  let carbRatio = 0.45;
  let fatRatio = 0.30;

  if (goal === 'fat_loss') {
    calTarget = tdee - 500;
    proteinRatio = 0.35;
    carbRatio = 0.35;
    fatRatio = 0.30;
  } else if (goal === 'muscle_gain') {
    calTarget = tdee + 300;
    proteinRatio = 0.30;
    carbRatio = 0.50;
    fatRatio = 0.20;
  }

  return {
    calories: Math.round(calTarget),
    protein: Math.round((calTarget * proteinRatio) / 4),
    carbs: Math.round((calTarget * carbRatio) / 4),
    fat: Math.round((calTarget * fatRatio) / 9),
  };
};

export const getRemainingMacros = (targets, loggedTotal) => {
  return {
    calories: Math.max(0, targets.calories - (loggedTotal.totalCalories || 0)),
    protein: Math.max(0, targets.protein - (loggedTotal.totalProtein || 0)),
    carbs: Math.max(0, targets.carbs - (loggedTotal.totalCarbs || 0)),
    fat: Math.max(0, targets.fat - (loggedTotal.totalFat || 0)),
  };
};

export const getGuidance = (targets, consumed, timeOfDay = 'any') => {
  const remaining = getRemainingMacros(targets, consumed);
  const insights = [];
  const suggestions = [];

  // Goal: Muscle Gain prioritize protein
  if (remaining.protein > 30) {
    insights.push(`You need ~${remaining.protein}g more protein today to hit your goal.`);
    suggestions.push(...FOOD_DATABASE.filter(f => f.tags.includes('high_protein')).slice(0, 2));
  } else if (remaining.calories > 500) {
    insights.push("You're well under your calorie target. Consider a hearty balanced meal.");
    suggestions.push(...FOOD_DATABASE.filter(f => f.tags.includes('indian')).slice(0, 2));
  } else if (remaining.calories < 200 && remaining.calories > 0) {
    insights.push("You're almost at your limit. Opt for light snacks if still hungry.");
    suggestions.push(...FOOD_DATABASE.filter(f => f.tags.includes('quick') && f.calories < 150).slice(0, 2));
  } else if (remaining.calories === 0) {
    insights.push("Daily target reached! Maintain this consistency.");
  }

  // Carb limit check
  if (consumed.totalCarbs > targets.carbs) {
    insights.push("Carb limit exceeded. Focus on lean protein and fats for the next meal.");
    const lowCarbSuggestions = FOOD_DATABASE.filter(f => f.tags.includes('low_carb'));
    if (lowCarbSuggestions.length) suggestions.unshift(lowCarbSuggestions[0]);
  }

  return {
    insights: insights.length > 0 ? insights : ["Calculating insights..."],
    suggestions: [...new Set(suggestions)].slice(0, 3),
    remaining
  };
};

/**
 * Quick-add macro presets for common foods
 * Provides one-tap logging for frequently eaten items
 */
export const QUICK_ADD_PRESETS = [
  { name: 'Protein Shake', protein: 25, carbs: 5, fat: 2, calories: 130 },
  { name: '2 Boiled Eggs', protein: 12, carbs: 1, fat: 10, calories: 140 },
  { name: 'Banana', protein: 1, carbs: 27, fat: 0, calories: 105 },
  { name: 'Chapati (1)', protein: 3, carbs: 15, fat: 0.5, calories: 80 },
  { name: 'Rice (1 bowl)', protein: 4, carbs: 45, fat: 0.5, calories: 200 },
  { name: 'Milk (1 glass)', protein: 8, carbs: 12, fat: 5, calories: 120 },
];

/**
 * Adjust daily targets based on workout intensity
 * Post-workout, the body needs extra fuel
 * @param {object} baseTargets - from getDailyTargets
 * @param {{ calories: number, intensity: string }} workoutData - from workoutIntensity
 * @returns {object} adjusted targets
 */
export const adjustTargetsForWorkout = (baseTargets, workoutData) => {
  if (!workoutData) return baseTargets;

  const extra = workoutData.calories || 0;
  const adjusted = { ...baseTargets };
  adjusted.calories += extra;
  adjusted.protein += Math.round(extra * 0.3 / 4); // 30% of extra as protein
  adjusted.carbs += Math.round(extra * 0.5 / 4);   // 50% as carbs
  adjusted.fat += Math.round(extra * 0.2 / 9);      // 20% as fat

  return adjusted;
};
