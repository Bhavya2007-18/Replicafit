/**
 * Strivio Adaptive Workout Engine
 * Analyzes user performance and auto-adjusts workout difficulty.
 * Rules-based system that modifies reps, sets, and exercise selection.
 */

/**
 * Analyze recent performance and recommend adjustments
 * @param {Object} progress - { avgAccuracy, totalWorkouts, streak }
 * @param {Array} recentSessions - last 7 workout sessions
 * @param {Object} currentPlan - current workout plan
 * @returns {Object} adapted plan recommendations
 */
export const adaptWorkoutPlan = (progress, recentSessions, currentPlan) => {
  const adjustments = [];
  let difficultyDelta = 0; // positive = harder, negative = easier

  if (!recentSessions || recentSessions.length === 0) {
    return { adjustments: ['Complete your first workout to enable adaptive training!'], difficultyDelta: 0 };
  }

  const avgAccuracy = recentSessions.reduce((s, w) => s + (w.totalAccuracy || 0), 0) / recentSessions.length;
  const sessionsThisWeek = recentSessions.filter(s => {
    const daysDiff = (Date.now() - new Date(s.completedAt).getTime()) / 86400000;
    return daysDiff <= 7;
  }).length;

  // Rule 1: High accuracy → increase difficulty
  if (avgAccuracy > 85) {
    difficultyDelta += 1;
    adjustments.push('Your form is excellent! Increasing reps by 2 per exercise.');
  }

  // Rule 2: Low accuracy → decrease difficulty
  if (avgAccuracy < 50 && recentSessions.length >= 3) {
    difficultyDelta -= 1;
    adjustments.push('Focus on form first. Reducing reps to help you nail technique.');
  }

  // Rule 3: Missed workouts → reduce volume
  if (sessionsThisWeek <= 1 && recentSessions.length >= 5) {
    difficultyDelta -= 1;
    adjustments.push('You have been less active this week. Easing you back in with shorter sessions.');
  }

  // Rule 4: Consistent streak → progressive overload
  if (progress.streak >= 7) {
    difficultyDelta += 1;
    adjustments.push(`${progress.streak}-day streak! Adding an extra set to challenge you.`);
  }

  // Rule 5: Fatigue detection — declining accuracy trend
  if (recentSessions.length >= 3) {
    const lastThree = recentSessions.slice(0, 3).map(s => s.totalAccuracy || 0);
    const isDecreasing = lastThree[0] < lastThree[1] && lastThree[1] < lastThree[2];
    if (isDecreasing) {
      adjustments.push('Your accuracy is declining — consider a rest day for recovery.');
      difficultyDelta -= 1;
    }
  }

  if (adjustments.length === 0) {
    adjustments.push('Your training is on track. Keep up the great work!');
  }

  return { adjustments, difficultyDelta };
};

/**
 * Apply difficulty delta to a workout plan
 */
export const applyAdaptation = (plan, difficultyDelta) => {
  if (!plan || !plan.days) return plan;

  return {
    ...plan,
    days: plan.days.map(day => ({
      ...day,
      exercises: day.exercises?.map(ex => {
        const currentReps = parseInt(ex.reps) || 10;
        const currentSets = ex.sets || 3;
        return {
          ...ex,
          sets: Math.max(2, currentSets + (difficultyDelta > 0 ? 1 : 0)),
          reps: String(Math.max(5, currentReps + difficultyDelta * 2)),
        };
      }),
    })),
  };
};
