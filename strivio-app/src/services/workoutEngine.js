import { exerciseDatabase } from '../data/exerciseDatabase';

class AIWorkoutEngine {
  constructor() {
    this.userHistory = [];
    this.performanceData = {};
    this.adaptationRules = {
      progressiveOverload: 0.1, // 10% increase per successful week
      deloadThreshold: 0.7, // Deload if performance drops below 70%
      recoveryMultiplier: 1.5 // Increase rest by 50% for fatigue
    };
  }

  /**
   * Generate personalized workout plan using AI algorithms
   */
  generatePersonalizedPlan(userProfile, performanceHistory = []) {
    const { 
      goal, 
      experienceLevel, 
      age, 
      fitnessLevel, 
      availableEquipment, 
      timeConstraints,
      injuryHistory 
    } = userProfile;

    // Analyze performance history
    const performanceAnalysis = this.analyzePerformanceHistory(performanceHistory);
    
    // Calculate training parameters
    const trainingParams = this.calculateTrainingParameters(userProfile, performanceAnalysis);
    
    // Select appropriate exercises
    const selectedExercises = this.selectExercises(
      goal, 
      experienceLevel, 
      availableEquipment, 
      injuryHistory,
      performanceAnalysis
    );
    
    // Generate workout schedule
    const workoutSchedule = this.generateWorkoutSchedule(
      selectedExercises, 
      trainingParams, 
      timeConstraints
    );
    
    // Apply AI adaptations
    const adaptedSchedule = this.applyAIAdaptations(workoutSchedule, performanceAnalysis);
    
    return {
      plan: adaptedSchedule,
      parameters: trainingParams,
      adaptations: performanceAnalysis,
      predictedProgress: this.predictProgress(adaptedSchedule, userProfile),
      recommendations: this.generateRecommendations(performanceAnalysis)
    };
  }

  /**
   * Analyze user's performance history
   */
  analyzePerformanceHistory(performanceHistory) {
    if (!performanceHistory || performanceHistory.length === 0) {
      return {
        trend: 'beginner',
        strengths: [],
        weaknesses: [],
        fatigueLevel: 'low',
        adaptationLevel: 'novice',
        consistency: 0
      };
    }

    const recentWorkouts = performanceHistory.slice(-10); // Last 10 workouts
    const avgAccuracy = recentWorkouts.reduce((sum, w) => sum + w.avgAccuracy, 0) / recentWorkouts.length;
    const completionRate = recentWorkouts.filter(w => w.completed).length / recentWorkouts.length;
    const avgFatigue = recentWorkouts.reduce((sum, w) => sum + (w.fatigueScore || 0), 0) / recentWorkouts.length;

    // Identify exercise-specific patterns
    const exercisePerformance = {};
    recentWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (!exercisePerformance[exercise.id]) {
          exercisePerformance[exercise.id] = [];
        }
        exercisePerformance[exercise.id].push({
          accuracy: exercise.accuracy,
          completed: exercise.completed,
          fatigue: exercise.fatigueScore
        });
      });
    });

    const strengths = [];
    const weaknesses = [];

    Object.entries(exercisePerformance).forEach(([exerciseId, performances]) => {
      const avgExAccuracy = performances.reduce((sum, p) => sum + p.accuracy, 0) / performances.length;
      const completionRate = performances.filter(p => p.completed).length / performances.length;
      
      if (avgExAccuracy > 85 && completionRate > 0.9) {
        strengths.push(exerciseId);
      } else if (avgExAccuracy < 70 || completionRate < 0.7) {
        weaknesses.push(exerciseId);
      }
    });

    return {
      trend: this.calculateTrend(recentWorkouts),
      strengths,
      weaknesses,
      fatigueLevel: this.categorizeFatigue(avgFatigue),
      adaptationLevel: this.assessAdaptationLevel(avgAccuracy, completionRate),
      consistency: completionRate,
      exercisePerformance
    };
  }

  /**
   * Calculate training parameters based on user profile and performance
   */
  calculateTrainingParameters(userProfile, performanceAnalysis) {
    const { goal, experienceLevel, age, fitnessLevel } = userProfile;
    const { adaptationLevel, fatigueLevel } = performanceAnalysis;

    let baseParams = {
      volume: 'moderate',
      intensity: 'moderate',
      frequency: 3,
      restPeriods: 60,
      progressionRate: 0.05
    };

    // Adjust based on experience
    switch (experienceLevel) {
      case 'Beginner':
        baseParams.frequency = 3;
        baseParams.intensity = 'low';
        baseParams.volume = 'low';
        baseParams.restPeriods = 90;
        break;
      case 'Intermediate':
        baseParams.frequency = 4;
        baseParams.intensity = 'moderate';
        baseParams.volume = 'moderate';
        baseParams.restPeriods = 75;
        break;
      case 'Advanced':
        baseParams.frequency = 5;
        baseParams.intensity = 'high';
        baseParams.volume = 'high';
        baseParams.restPeriods = 60;
        break;
    }

    // Adjust based on goal
    switch (goal) {
      case 'fat_loss':
        baseParams.frequency += 1;
        baseParams.intensity = 'high';
        baseParams.restPeriods -= 15;
        break;
      case 'muscle_gain':
        baseParams.volume = 'high';
        baseParams.restPeriods += 30;
        baseParams.progressionRate = 0.08;
        break;
      case 'endurance':
        baseParams.frequency = Math.min(baseParams.frequency + 1, 6);
        baseParams.intensity = 'moderate';
        baseParams.restPeriods -= 15;
        break;
    }

    // Adjust based on performance
    if (fatigueLevel === 'high') {
      baseParams.intensity = 'low';
      baseParams.restPeriods += 30;
      baseParams.progressionRate = 0.02;
    } else if (adaptationLevel === 'advanced') {
      baseParams.progressionRate = 0.12;
    }

    // Adjust based on age
    if (age > 45) {
      baseParams.frequency = Math.max(baseParams.frequency - 1, 2);
      baseParams.restPeriods += 15;
      baseParams.progressionRate = 0.03;
    }

    return baseParams;
  }

  /**
   * Select exercises based on multiple criteria
   */
  selectExercises(goal, experienceLevel, availableEquipment, injuryHistory, performanceAnalysis) {
    let exercises = [...exerciseDatabase];

    // Filter by experience level
    if (experienceLevel === 'Beginner') {
      exercises = exercises.filter(e => e.difficulty === 'Beginner');
    } else if (experienceLevel === 'Intermediate') {
      exercises = exercises.filter(e => e.difficulty !== 'Advanced');
    }

    // Filter by equipment
    if (availableEquipment && availableEquipment.length > 0) {
      exercises = exercises.filter(e => 
        e.equipment.some(eq => availableEquipment.includes(eq))
      );
    }

    // Exclude exercises for injury history
    if (injuryHistory && injuryHistory.length > 0) {
      exercises = exercises.filter(e => 
        !injuryHistory.some(injury => 
          e.targetMuscles.some(muscle => 
            muscle.toLowerCase().includes(injury.toLowerCase())
          )
        )
      );
    }

    // Prioritize weak areas
    if (performanceAnalysis.weaknesses.length > 0) {
      const weaknessExercises = exercises.filter(e => 
        performanceAnalysis.weaknesses.includes(e.id)
      );
      const otherExercises = exercises.filter(e => 
        !performanceAnalysis.weaknesses.includes(e.id)
      );
      exercises = [...weaknessExercises, ...otherExercises];
    }

    // Select goal-appropriate exercises
    const goalExercises = exercises.filter(e => 
      this.isExerciseGoalAppropriate(e, goal)
    );

    return goalExercises.length > 0 ? goalExercises : exercises;
  }

  /**
   * Check if exercise is appropriate for specific goal
   */
  isExerciseGoalAppropriate(exercise, goal) {
    const goalCategories = {
      fat_loss: ['cardio', 'compound', 'full_body'],
      muscle_gain: ['strength', 'compound', 'isolation'],
      endurance: ['cardio', 'compound', 'functional']
    };

    return goalCategories[goal].some(category => 
      exercise.category === category || 
      exercise.tags?.includes(category)
    );
  }

  /**
   * Generate workout schedule
   */
  generateWorkoutSchedule(exercises, trainingParams, timeConstraints) {
    const { frequency, volume, intensity, restPeriods } = trainingParams;
    const schedule = [];
    const exercisesPerWorkout = Math.ceil(exercises.length / frequency);

    for (let day = 1; day <= frequency; day++) {
      const startIndex = (day - 1) * exercisesPerWorkout;
      const endIndex = Math.min(startIndex + exercisesPerWorkout, exercises.length);
      const workoutExercises = exercises.slice(startIndex, endIndex);

      const workout = {
        day,
        name: `Workout ${day}`,
        exercises: workoutExercises.map(exercise => ({
          ...exercise,
          sets: this.calculateSets(exercise, volume, intensity),
          reps: this.calculateReps(exercise, intensity, trainingParams),
          rest: restPeriods,
          intensity: this.getExerciseIntensity(exercise, intensity)
        })),
        estimatedDuration: this.calculateWorkoutDuration(workoutExercises, restPeriods),
        focus: this.getWorkoutFocus(workoutExercises)
      };

      schedule.push(workout);
    }

    return schedule;
  }

  /**
   * Apply AI adaptations to workout schedule
   */
  applyAIAdaptations(schedule, performanceAnalysis) {
    const adaptedSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy

    adaptedSchedule.forEach((workout, index) => {
      // Adapt based on fatigue level
      if (performanceAnalysis.fatigueLevel === 'high') {
        workout.exercises.forEach(exercise => {
          exercise.sets = Math.max(exercise.sets - 1, 1);
          exercise.rest = exercise.rest * 1.5;
          exercise.intensity = 'low';
        });
      }

      // Adapt based on weaknesses
      workout.exercises.forEach(exercise => {
        if (performanceAnalysis.weaknesses.includes(exercise.id)) {
          exercise.sets += 1;
          exercise.rest += 15;
          exercise.notes = 'Focus on form - this is a weakness area';
        }
      });

      // Add progressive overload
      if (performanceAnalysis.adaptationLevel === 'advanced') {
        workout.exercises.forEach(exercise => {
          exercise.sets += 1;
          exercise.progression = 'increase_weight_or_reps';
        });
      }
    });

    return adaptedSchedule;
  }

  /**
   * Calculate sets for exercise
   */
  calculateSets(exercise, volume, intensity) {
    const baseSets = {
      low: 2,
      moderate: 3,
      high: 4
    };

    let sets = baseSets[volume] || 3;

    // Adjust for exercise type
    if (exercise.category === 'cardio') {
      sets = 1;
    } else if (exercise.category === 'isolation') {
      sets = Math.max(sets - 1, 2);
    }

    return sets;
  }

  /**
   * Calculate reps for exercise
   */
  calculateReps(exercise, intensity, trainingParams) {
    const repRanges = {
      strength: { low: '12-15', moderate: '8-12', high: '6-8' },
      hypertrophy: { low: '15-20', moderate: '10-15', high: '8-12' },
      endurance: { low: '20-25', moderate: '15-20', high: '12-15' },
      cardio: { low: '45-60 min', moderate: '30-45 min', high: '20-30 min' }
    };

    const category = exercise.category === 'cardio' ? 'cardio' : 
                     trainingParams.goal === 'muscle_gain' ? 'hypertrophy' :
                     trainingParams.goal === 'endurance' ? 'endurance' : 'strength';

    return repRanges[category]?.[intensity] || '8-12';
  }

  /**
   * Get exercise intensity level
   */
  getExerciseIntensity(exercise, targetIntensity) {
    const intensityMap = {
      low: 0.6,
      moderate: 0.75,
      high: 0.9
    };

    return intensityMap[targetIntensity] || 0.75;
  }

  /**
   * Calculate workout duration
   */
  calculateWorkoutDuration(exercises, restPeriods) {
    const exerciseTime = exercises.length * 45; // 45 seconds per set average
    const restTime = exercises.reduce((sum, ex) => sum + (ex.sets * restPeriods), 0);
    const warmupTime = 5 * 60; // 5 minutes
    const cooldownTime = 5 * 60; // 5 minutes

    return Math.round((warmupTime + exerciseTime + restTime + cooldownTime) / 60); // Convert to minutes
  }

  /**
   * Get workout focus area
   */
  getWorkoutFocus(exercises) {
    const muscleGroups = exercises.flatMap(e => e.targetMuscles);
    const frequency = {};
    
    muscleGroups.forEach(muscle => {
      frequency[muscle] = (frequency[muscle] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([muscle]) => muscle)
      .join(' & ');
  }

  /**
   * Predict user progress
   */
  predictProgress(schedule, userProfile) {
    const totalVolume = schedule.reduce((sum, workout) => {
      return sum + workout.exercises.reduce((workoutSum, exercise) => {
        const sets = exercise.sets;
        const avgReps = this.parseRepRange(exercise.reps);
        return workoutSum + (sets * avgReps);
      }, 0);
    }, 0);

    const predictedImprovements = {
      strength: totalVolume * 0.01, // 1% strength gain per volume unit
      endurance: schedule.length * 2, // 2% endurance per workout
      weightLoss: userProfile.goal === 'fat_loss' ? totalVolume * 0.002 : 0,
      muscleGain: userProfile.goal === 'muscle_gain' ? totalVolume * 0.0015 : 0
    };

    return {
      weeklyImprovements: predictedImprovements,
      timeline: this.calculateTimeline(predictedImprovements, userProfile.goal),
      confidence: this.calculatePredictionConfidence(userProfile.experienceLevel)
    };
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(performanceAnalysis) {
    const recommendations = [];

    if (performanceAnalysis.fatigueLevel === 'high') {
      recommendations.push({
        type: 'recovery',
        priority: 'high',
        message: 'Consider taking an extra rest day or reducing workout intensity',
        action: 'schedule_recovery'
      });
    }

    if (performanceAnalysis.consistency < 0.7) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        message: 'Try to maintain a more consistent workout schedule',
        action: 'set_reminders'
      });
    }

    performanceAnalysis.weaknesses.forEach(weakness => {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        message: `Focus on improving ${weakness} exercises`,
        action: 'add_technical_work'
      });
    });

    return recommendations;
  }

  // Helper methods
  calculateTrend(workouts) {
    if (workouts.length < 3) return 'insufficient_data';
    
    const recent = workouts.slice(-3);
    const older = workouts.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, w) => sum + w.avgAccuracy, 0) / recent.length;
    const olderAvg = older.reduce((sum, w) => sum + w.avgAccuracy, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }

  categorizeFatigue(avgFatigue) {
    if (avgFatigue > 70) return 'high';
    if (avgFatigue > 40) return 'moderate';
    return 'low';
  }

  assessAdaptationLevel(avgAccuracy, completionRate) {
    if (avgAccuracy > 85 && completionRate > 0.9) return 'advanced';
    if (avgAccuracy > 70 && completionRate > 0.7) return 'intermediate';
    return 'novice';
  }

  parseRepRange(repRange) {
    if (typeof repRange === 'string' && repRange.includes('-')) {
      const [min, max] = repRange.split('-').map(Number);
      return Math.round((min + max) / 2);
    }
    return 10; // Default
  }

  calculateTimeline(improvements, goal) {
    const baseTimeline = {
      fat_loss: 12, // 12 weeks
      muscle_gain: 16, // 16 weeks
      endurance: 8 // 8 weeks
    };

    return baseTimeline[goal] || 12;
  }

  calculatePredictionConfidence(experienceLevel) {
    const confidenceMap = {
      Beginner: 0.7,
      Intermediate: 0.8,
      Advanced: 0.9
    };

    return confidenceMap[experienceLevel] || 0.75;
  }
}

// Export singleton instance
export const aiWorkoutEngine = new AIWorkoutEngine();

// Legacy function for backward compatibility
export const defineWorkoutPlan = (profile) => {
  const plan = aiWorkoutEngine.generatePersonalizedPlan(profile);
  return plan.plan;
};
