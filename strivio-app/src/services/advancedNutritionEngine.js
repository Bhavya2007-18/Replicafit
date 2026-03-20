/**
 * Strivio Advanced Nutrition Guidance Engine
 * Comprehensive nutrition planning with AI-powered recommendations
 * Macro tracking, meal planning, and dietary optimization
 */

class AdvancedNutritionEngine {
  constructor() {
    this.bmrFormulas = {
      mifflin: this.mifflinStJeor,
      harris: this.harrisBenedict,
      katch: this.katchMcArdle
    };
    this.macroRatios = {
      fat_loss: { protein: 0.4, carbs: 0.3, fat: 0.3 },
      muscle_gain: { protein: 0.35, carbs: 0.45, fat: 0.2 },
      endurance: { protein: 0.25, carbs: 0.6, fat: 0.15 },
      maintenance: { protein: 0.3, carbs: 0.4, fat: 0.3 }
    };
    this.foodDatabase = this.initializeFoodDatabase();
  }

  /**
   * Generate comprehensive nutrition plan
   */
  generateNutritionPlan(userProfile, goals, preferences, restrictions = []) {
    const {
      age,
      gender,
      height,
      weight,
      activityLevel,
      bodyFat,
      dietaryRestrictions,
      allergies
    } = userProfile;

    // Calculate BMR and TDEE
    const bmr = this.calculateBMR(weight, height, age, gender, bodyFat);
    const tdee = this.calculateTDEE(bmr, activityLevel);
    
    // Adjust calories based on goals
    const targetCalories = this.adjustCaloriesForGoal(tdee, goals.target, goals.rate);
    
    // Calculate macros
    const macros = this.calculateMacros(targetCalories, goals.target, weight, activityLevel);
    
    // Generate meal plan
    const mealPlan = this.generateMealPlan(macros, preferences, restrictions, allergies);
    
    // Create supplement recommendations
    const supplements = this.recommendSupplements(goals.target, dietaryRestrictions);
    
    // Generate eating schedule
    const schedule = this.generateEatingSchedule(goals.target, activityLevel, preferences);
    
    // Calculate hydration needs
    const hydration = this.calculateHydrationNeeds(weight, activityLevel, goals.target);
    
    return {
      calories: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        target: Math.round(targetCalories),
        deficit: Math.round(tdee - targetCalories)
      },
      macros,
      mealPlan,
      supplements,
      schedule,
      hydration,
      predictions: this.predictNutritionProgress(targetCalories, macros, goals),
      recommendations: this.generateNutritionRecommendations(userProfile, goals, macros)
    };
  }

  /**
   * Calculate Basal Metabolic Rate using multiple formulas
   */
  calculateBMR(weight, height, age, gender, bodyFat = null) {
    // Use Katch-McArdle if body fat is available (most accurate)
    if (bodyFat) {
      return this.bmrFormulas.katch(weight, bodyFat);
    }
    
    // Default to Mifflin-St Jeor (most accurate without body fat)
    return this.bmrFormulas.mifflin(weight, height, age, gender);
  }

  /**
   * Mifflin-St Jeor equation
   */
  mifflinStJeor(weight, height, age, gender) {
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
  }

  /**
   * Harris-Benedict equation (revised)
   */
  harrisBenedict(weight, height, age, gender) {
    const base = (13.397 * weight) + (4.799 * height) - (5.677 * age);
    return gender === 'male' ? base + 88.362 : base - 447.593;
  }

  /**
   * Katch-McArdle equation (requires body fat)
   */
  katchMcArdle(weight, bodyFat) {
    const leanMass = weight * (1 - bodyFat / 100);
    return 370 + (21.6 * leanMass);
  }

  /**
   * Calculate Total Daily Energy Expenditure
   */
  calculateTDEE(bmr, activityLevel) {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    return bmr * (multipliers[activityLevel] || 1.55);
  }

  /**
   * Adjust calories based on goals
   */
  adjustCaloriesForGoal(tdee, target, rate = 'moderate') {
    const adjustments = {
      fat_loss: {
        slow: tdee * 0.85,      // 15% deficit
        moderate: tdee * 0.80,  // 20% deficit
        aggressive: tdee * 0.75  // 25% deficit
      },
      muscle_gain: {
        slow: tdee * 1.05,      // 5% surplus
        moderate: tdee * 1.10,  // 10% surplus
        aggressive: tdee * 1.15  // 15% surplus
      },
      maintenance: {
        slow: tdee,
        moderate: tdee,
        aggressive: tdee
      },
      endurance: {
        slow: tdee * 1.05,
        moderate: tdee * 1.10,
        aggressive: tdee * 1.15
      }
    };

    return adjustments[target]?.[rate] || tdee;
  }

  /**
   * Calculate macronutrient distribution
   */
  calculateMacros(calories, goal, weight, activityLevel) {
    const ratios = this.macroRatios[goal] || this.macroRatios.maintenance;
    
    // Adjust protein based on activity level and goal
    let proteinMultiplier = 2.0; // g per kg body weight
    
    if (goal === 'muscle_gain') {
      proteinMultiplier = activityLevel === 'very_active' ? 2.4 : 2.2;
    } else if (goal === 'fat_loss') {
      proteinMultiplier = 2.2; // Higher protein to preserve muscle
    } else if (goal === 'endurance') {
      proteinMultiplier = 1.8;
    }

    const protein = proteinMultiplier * weight;
    const proteinCalories = protein * 4;
    
    const fatCalories = calories * ratios.fat;
    const fat = fatCalories / 9;
    
    const carbCalories = calories - proteinCalories - fatCalories;
    const carbs = carbCalories / 4;

    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      calories: Math.round(calories),
      percentages: {
        protein: Math.round((proteinCalories / calories) * 100),
        carbs: Math.round((carbCalories / calories) * 100),
        fat: Math.round((fatCalories / calories) * 100)
      }
    };
  }

  /**
   * Generate personalized meal plan
   */
  generateMealPlan(macros, preferences, restrictions, allergies) {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const mealPlan = {};

    // Distribute macros across meals
    const macroDistribution = {
      breakfast: { protein: 0.25, carbs: 0.3, fat: 0.25 },
      lunch: { protein: 0.3, carbs: 0.3, fat: 0.25 },
      dinner: { protein: 0.35, carbs: 0.25, fat: 0.3 },
      snacks: { protein: 0.1, carbs: 0.15, fat: 0.2 }
    };

    meals.forEach(meal => {
      const distribution = macroDistribution[meal];
      const mealMacros = {
        protein: Math.round(macros.protein * distribution.protein),
        carbs: Math.round(macros.carbs * distribution.carbs),
        fat: Math.round(macros.fat * distribution.fat)
      };

      mealPlan[meal] = this.generateMealOptions(mealMacros, preferences, restrictions, allergies);
    });

    return mealPlan;
  }

  /**
   * Generate meal options for specific macros
   */
  generateMealOptions(mealMacros, preferences, restrictions, allergies) {
    const suitableFoods = this.foodDatabase.filter(food => {
      // Check restrictions
      if (restrictions.includes('vegetarian') && food.category === 'meat') return false;
      if (restrictions.includes('vegan') && (food.category === 'meat' || food.category === 'dairy')) return false;
      if (restrictions.includes('gluten_free') && food.containsGluten) return false;
      
      // Check allergies
      if (allergies.some(allergy => food.allergens?.includes(allergy))) return false;
      
      return true;
    });

    // Generate 3 different options
    const options = [];
    for (let i = 0; i < 3; i++) {
      const option = this.createBalancedMeal(mealMacros, suitableFoods, preferences);
      options.push(option);
    }

    return options;
  }

  /**
   * Create a balanced meal from available foods
   */
  createBalancedMeal(targetMacros, availableFoods, preferences) {
    const meal = {
      name: this.generateMealName(preferences),
      foods: [],
      nutrition: { protein: 0, carbs: 0, fat: 0, calories: 0 },
      preparation: this.getPreparationMethod(preferences)
    };

    // Simple algorithm to match macros
    const remainingMacros = { ...targetMacros };
    
    // Add protein source
    const proteinFoods = availableFoods.filter(f => f.protein > 15);
    if (proteinFoods.length > 0) {
      const proteinFood = this.selectFood(proteinFoods, remainingMacros.protein, 'protein');
      if (proteinFood) {
        const amount = this.calculateAmount(proteinFood, remainingMacros.protein, 'protein');
        meal.foods.push({ ...proteinFood, amount: amount + 'g' });
        this.updateMealNutrition(meal.nutrition, proteinFood, amount);
        remainingMacros.protein -= (proteinFood.protein * amount / 100);
      }
    }

    // Add carb source
    const carbFoods = availableFoods.filter(f => f.carbs > 15);
    if (carbFoods.length > 0 && remainingMacros.carbs > 0) {
      const carbFood = this.selectFood(carbFoods, remainingMacros.carbs, 'carbs');
      if (carbFood) {
        const amount = this.calculateAmount(carbFood, remainingMacros.carbs, 'carbs');
        meal.foods.push({ ...carbFood, amount: amount + 'g' });
        this.updateMealNutrition(meal.nutrition, carbFood, amount);
        remainingMacros.carbs -= (carbFood.carbs * amount / 100);
      }
    }

    // Add fat source
    const fatFoods = availableFoods.filter(f => f.fat > 5);
    if (fatFoods.length > 0 && remainingMacros.fat > 0) {
      const fatFood = this.selectFood(fatFoods, remainingMacros.fat, 'fat');
      if (fatFood) {
        const amount = this.calculateAmount(fatFood, remainingMacros.fat, 'fat');
        meal.foods.push({ ...fatFood, amount: amount + 'g' });
        this.updateMealNutrition(meal.nutrition, fatFood, amount);
        remainingMacros.fat -= (fatFood.fat * amount / 100);
      }
    }

    // Add vegetables for micronutrients
    const vegetables = availableFoods.filter(f => f.category === 'vegetable');
    vegetables.slice(0, 2).forEach(veg => {
      meal.foods.push({ ...veg, amount: '100g' });
      this.updateMealNutrition(meal.nutrition, veg, 100);
    });

    return meal;
  }

  /**
   * Recommend supplements based on goals and restrictions
   */
  recommendSupplements(goal, restrictions) {
    const supplements = [];

    // Basic recommendations for everyone
    supplements.push({
      name: 'Multivitamin',
      reason: 'Fill micronutrient gaps',
      dosage: '1 tablet daily',
      priority: 'medium'
    });

    // Goal-specific recommendations
    if (goal === 'muscle_gain') {
      supplements.push({
        name: 'Whey Protein',
        reason: 'Convenient protein source for muscle building',
        dosage: '25-30g post-workout',
        priority: 'high'
      });
      
      supplements.push({
        name: 'Creatine',
        reason: 'Improves strength and performance',
        dosage: '5g daily',
        priority: 'high'
      });
    }

    if (goal === 'fat_loss') {
      supplements.push({
        name: 'Caffeine',
        reason: 'Boost metabolism and energy',
        dosage: '200mg pre-workout',
        priority: 'medium'
      });
    }

    if (goal === 'endurance') {
      supplements.push({
        name: 'Electrolyte Mix',
        reason: 'Maintain hydration during long sessions',
        dosage: 'During workouts > 60min',
        priority: 'high'
      });
    }

    // Restriction-specific recommendations
    if (restrictions.includes('vegan')) {
      supplements.push({
        name: 'Vitamin B12',
        reason: 'Essential for vegans',
        dosage: '2500mcg weekly',
        priority: 'high'
      });
      
      supplements.push({
        name: 'Vitamin D',
        reason: 'Common deficiency in plant-based diets',
        dosage: '2000 IU daily',
        priority: 'medium'
      });
    }

    return supplements;
  }

  /**
   * Generate eating schedule
   */
  generateEatingSchedule(goal, activityLevel, preferences) {
    const schedules = {
      fat_loss: {
        meals: 4,
        timing: ['7:00 AM', '12:00 PM', '4:00 PM', '7:00 PM'],
        notes: 'Include protein with each meal to preserve muscle mass'
      },
      muscle_gain: {
        meals: 5,
        timing: ['7:00 AM', '10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM'],
        notes: 'Eat every 3-4 hours, include post-workout protein'
      },
      endurance: {
        meals: 4,
        timing: ['6:00 AM', '9:00 AM', '12:00 PM', '6:00 PM'],
        notes: 'Focus on carbs before and during training'
      },
      maintenance: {
        meals: 3,
        timing: ['8:00 AM', '1:00 PM', '7:00 PM'],
        notes: 'Balanced meals at regular intervals'
      }
    };

    return schedules[goal] || schedules.maintenance;
  }

  /**
   * Calculate hydration needs
   */
  calculateHydrationNeeds(weight, activityLevel, goal) {
    let baseHydration = weight * 35; // 35ml per kg body weight

    // Adjust for activity level
    const activityMultipliers = {
      sedentary: 1.0,
      light: 1.1,
      moderate: 1.2,
      active: 1.3,
      very_active: 1.4
    };

    baseHydration *= activityMultipliers[activityLevel] || 1.2;

    // Additional for endurance goals
    if (goal === 'endurance') {
      baseHydration *= 1.1;
    }

    return {
      daily: Math.round(baseHydration), // in ml
      duringWorkout: Math.round(weight * 10), // 10ml per kg during workout
      hourly: Math.round(baseHydration / 16), // spread across waking hours
      inLiters: Math.round(baseHydration / 1000 * 10) / 10
    };
  }

  // Helper methods
  initializeFoodDatabase() {
    return [
      // Proteins
      { name: 'Chicken Breast', category: 'meat', protein: 31, carbs: 0, fat: 3.6, allergens: [] },
      { name: 'Salmon', category: 'fish', protein: 25, carbs: 0, fat: 15, allergens: ['fish'] },
      { name: 'Eggs', category: 'dairy', protein: 13, carbs: 1, fat: 11, allergens: ['eggs'] },
      { name: 'Greek Yogurt', category: 'dairy', protein: 10, carbs: 6, fat: 4, allergens: ['dairy'] },
      { name: 'Tofu', category: 'plant', protein: 8, carbs: 2, fat: 4, allergens: ['soy'] },
      { name: 'Lentils', category: 'plant', protein: 9, carbs: 20, fat: 0.4, allergens: [] },
      
      // Carbs
      { name: 'Brown Rice', category: 'grain', protein: 7, carbs: 77, fat: 2.9, containsGluten: false },
      { name: 'Quinoa', category: 'grain', protein: 8, carbs: 64, fat: 6, containsGluten: false },
      { name: 'Oats', category: 'grain', protein: 17, carbs: 66, fat: 7, containsGluten: false },
      { name: 'Sweet Potato', category: 'vegetable', protein: 2, carbs: 20, fat: 0.1, allergens: [] },
      { name: 'Whole Wheat Pasta', category: 'grain', protein: 13, carbs: 75, fat: 2, containsGluten: true },
      
      // Fats
      { name: 'Avocado', category: 'fruit', protein: 2, carbs: 9, fat: 15, allergens: [] },
      { name: 'Almonds', category: 'nut', protein: 21, carbs: 22, fat: 49, allergens: ['nuts'] },
      { name: 'Olive Oil', category: 'oil', protein: 0, carbs: 0, fat: 100, allergens: [] },
      
      // Vegetables
      { name: 'Broccoli', category: 'vegetable', protein: 3, carbs: 7, fat: 0.4, allergens: [] },
      { name: 'Spinach', category: 'vegetable', protein: 3, carbs: 4, fat: 0.4, allergens: [] },
      { name: 'Bell Peppers', category: 'vegetable', protein: 1, carbs: 6, fat: 0.2, allergens: [] }
    ];
  }

  generateMealName(preferences) {
    const adjectives = ['Power', 'Lean', 'Energy', 'Fit', 'Strong'];
    const bases = ['Bowl', 'Plate', 'Meal', 'Feast', 'Fuel'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const base = bases[Math.floor(Math.random() * bases.length)];
    
    return `${adjective} ${base}`;
  }

  getPreparationMethod(preferences) {
    const methods = ['grilled', 'baked', 'steamed', 'roasted', 'stir-fried'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  selectFood(foods, targetAmount, macroType) {
    return foods.find(food => food[macroType] <= targetAmount * 1.5) || foods[0];
  }

  calculateAmount(food, targetAmount, macroType) {
    return Math.round((targetAmount / food[macroType]) * 100);
  }

  updateMealNutrition(nutrition, food, amount) {
    const factor = amount / 100;
    nutrition.protein += food.protein * factor;
    nutrition.carbs += food.carbs * factor;
    nutrition.fat += food.fat * factor;
    nutrition.calories += (food.protein * 4 + food.carbs * 4 + food.fat * 9) * factor;
  }
}

// Export singleton instance
export const advancedNutritionEngine = new AdvancedNutritionEngine();

// Legacy exports for backward compatibility
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

export const QUICK_ADD_PRESETS = [
  { name: 'Protein Shake', protein: 25, carbs: 5, fat: 2, calories: 130 },
  { name: '2 Boiled Eggs', protein: 12, carbs: 1, fat: 10, calories: 140 },
  { name: 'Banana', protein: 1, carbs: 27, fat: 0, calories: 105 },
  { name: 'Chapati (1)', protein: 3, carbs: 15, fat: 0.5, calories: 80 },
  { name: 'Rice (1 bowl)', protein: 4, carbs: 45, fat: 0.5, calories: 200 },
  { name: 'Milk (1 glass)', protein: 8, carbs: 12, fat: 5, calories: 120 },
];

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
