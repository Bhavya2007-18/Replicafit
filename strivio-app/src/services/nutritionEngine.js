/**
 * Strivio Nutrition Engine
 */

export const calculateMacros = (profile) => {
    // Basic defaults if profile isn't fully filled out
    const weightKg = profile.weight || 70;
    const heightCm = profile.height || 170;
    const age = profile.age || 25;
    const goal = profile.goal || 'muscle_gain';
    
    // Basal Metabolic Rate (BMR) - simplified Mifflin-St Jeor
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5; 

    // Total Daily Energy Expenditure (TDEE) - assuming moderate activity
    let tdee = bmr * 1.55;

    let targetCalories = tdee;
    let proteinMultiplier = 1.6; // grams per kg

    if (goal === 'fat_loss') {
        targetCalories = tdee - 500;
        proteinMultiplier = 2.0; // Higher protein to preserve muscle
    } else if (goal === 'muscle_gain') {
        targetCalories = tdee + 300;
        proteinMultiplier = 2.2;
    }

    const proteinGrams = weightKg * proteinMultiplier;
    const waterLiters = weightKg * 0.033; // ~33ml per kg

    return {
        calories: Math.round(targetCalories),
        protein: Math.round(proteinGrams),
        water: waterLiters.toFixed(1),
        suggestedFoods: [
            'Eggs & Lean Poultry',
            'Oats & Complex Carbs',
            'Lentils & Beans (Plant Protein)',
            'Leafy Greens & Colorful Veggies',
            'Greek Yogurt or Milk'
        ]
    };
};
