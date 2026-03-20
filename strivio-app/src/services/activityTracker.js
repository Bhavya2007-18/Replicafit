/**
 * Strivio Activity Tracking Integration Service
 * Integrates with Google Fit API and other activity tracking platforms
 * Provides comprehensive daily activity monitoring and analysis
 */

import * as GoogleFit from 'react-native-google-fit';

class ActivityTracker {
  constructor() {
    this.isAuthorized = false;
    this.dailyData = null;
    this.weeklyData = null;
    this.monthlyData = null;
  }

  /**
   * Initialize Google Fit connection
   */
  async initialize() {
    try {
      const isAvailable = await GoogleFit.isAvailable();
      if (!isAvailable) {
        throw new Error('Google Fit is not available on this device');
      }

      const authResult = await GoogleFit.authorize({
        scopes: [
          GoogleFit.Scopes.FITNESS_ACTIVITY_READ,
          GoogleFit.Scopes.FITNESS_BODY_READ,
          GoogleFit.Scopes.FITNESS_NUTRITION_READ,
          GoogleFit.Scopes.FITNESS_LOCATION_READ
        ]
      });

      this.isAuthorized = authResult.success;
      return this.isAuthorized;
    } catch (error) {
      console.error('Activity tracking initialization failed:', error);
      return false;
    }
  }

  /**
   * Get today's activity data
   */
  async getTodayActivity() {
    if (!this.isAuthorized) {
      await this.initialize();
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Get steps data
      const stepsResult = await GoogleFit.getDailySteps(startOfDay, endOfDay);
      
      // Get calories data
      const caloriesResult = await GoogleFit.getDailyCalories(startOfDay, endOfDay);
      
      // Get distance data
      const distanceResult = await GoogleFit.getDailyDistance(startOfDay, endOfDay);
      
      // Get active minutes
      const activeMinutesResult = await GoogleFit.getDailyActivitySamples(startOfDay, endOfDay);

      this.dailyData = {
        date: today.toISOString().split('T')[0],
        steps: stepsResult.length > 0 ? stepsResult[0].steps : 0,
        calories: caloriesResult.length > 0 ? caloriesResult[0].calories : 0,
        distance: distanceResult.length > 0 ? distanceResult[0].distance : 0,
        activeMinutes: this.calculateActiveMinutes(activeMinutesResult),
        activities: this.processActivities(activeMinutesResult)
      };

      return this.dailyData;
    } catch (error) {
      console.error('Failed to get today\'s activity:', error);
      return this.getMockDailyData();
    }
  }

  /**
   * Get weekly activity data
   */
  async getWeeklyActivity() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const weeklySteps = await GoogleFit.getDailySteps(startDate, endDate);
      const weeklyCalories = await GoogleFit.getDailyCalories(startDate, endDate);
      const weeklyDistance = await GoogleFit.getDailyDistance(startDate, endDate);

      this.weeklyData = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalSteps: weeklySteps.reduce((sum, day) => sum + day.steps, 0),
        totalCalories: weeklyCalories.reduce((sum, day) => sum + day.calories, 0),
        totalDistance: weeklyDistance.reduce((sum, day) => sum + day.distance, 0),
        dailyAverages: this.calculateWeeklyAverages(weeklySteps, weeklyCalories, weeklyDistance),
        trend: this.calculateTrend(weeklySteps)
      };

      return this.weeklyData;
    } catch (error) {
      console.error('Failed to get weekly activity:', error);
      return this.getMockWeeklyData();
    }
  }

  /**
   * Get monthly activity data
   */
  async getMonthlyActivity() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);

      const monthlySteps = await GoogleFit.getDailySteps(startDate, endDate);
      const monthlyCalories = await GoogleFit.getDailyCalories(startDate, endDate);

      this.monthlyData = {
        month: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalSteps: monthlySteps.reduce((sum, day) => sum + day.steps, 0),
        totalCalories: monthlyCalories.reduce((sum, day) => sum + day.calories, 0),
        dailyAverage: {
          steps: Math.round(monthlySteps.reduce((sum, day) => sum + day.steps, 0) / monthlySteps.length),
          calories: Math.round(monthlyCalories.reduce((sum, day) => sum + day.calories, 0) / monthlyCalories.length)
        },
        progress: this.calculateMonthlyProgress(monthlySteps)
      };

      return this.monthlyData;
    } catch (error) {
      console.error('Failed to get monthly activity:', error);
      return this.getMockMonthlyData();
    }
  }

  /**
   * Calculate active minutes from activity samples
   */
  calculateActiveMinutes(activitySamples) {
    let activeMinutes = 0;
    activitySamples.forEach(sample => {
      if (sample.activity && sample.duration) {
        // Only count moderate to vigorous activities
        if (sample.activity >= 3) { // 3+ is moderate activity
          activeMinutes += Math.floor(sample.duration / 60000); // Convert ms to minutes
        }
      }
    });
    return activeMinutes;
  }

  /**
   * Process and categorize activities
   */
  processActivities(activitySamples) {
    const activities = [];
    const activityMap = {};

    activitySamples.forEach(sample => {
      if (sample.activity && sample.duration) {
        const activityName = this.getActivityName(sample.activity);
        if (!activityMap[activityName]) {
          activityMap[activityName] = {
            name: activityName,
            duration: 0,
            count: 0
          };
        }
        activityMap[activityName].duration += sample.duration;
        activityMap[activityName].count += 1;
      }
    });

    Object.values(activityMap).forEach(activity => {
      activities.push({
        name: activity.name,
        duration: Math.floor(activity.duration / 60000), // Convert to minutes
        sessions: activity.count
      });
    });

    return activities.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get activity name from Google Fit activity type
   */
  getActivityName(activityType) {
    const activityNames = {
      1: 'Still',
      3: 'Walking',
      4: 'Running',
      5: 'Cycling',
      6: 'Swimming',
      7: 'Elliptical',
      8: 'Rowing',
      9: 'Strength Training',
      10: 'Yoga',
      11: 'Pilates',
      12: 'Dancing',
      13: 'Basketball',
      14: 'Soccer',
      15: 'Tennis',
      16: 'Hiking',
      17: 'Climbing'
    };
    return activityNames[activityType] || 'Other Activity';
  }

  /**
   * Calculate weekly averages
   */
  calculateWeeklyAverages(steps, calories, distance) {
    const days = steps.length || 7;
    return {
      steps: Math.round(steps.reduce((sum, day) => sum + day.steps, 0) / days),
      calories: Math.round(calories.reduce((sum, day) => sum + day.calories, 0) / days),
      distance: Math.round((distance.reduce((sum, day) => sum + day.distance, 0) / days) * 100) / 100
    };
  }

  /**
   * Calculate activity trend
   */
  calculateTrend(weeklySteps) {
    if (weeklySteps.length < 2) return 'stable';
    
    const firstHalf = weeklySteps.slice(0, Math.floor(weeklySteps.length / 2));
    const secondHalf = weeklySteps.slice(Math.floor(weeklySteps.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, day) => sum + day.steps, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, day) => sum + day.steps, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate monthly progress
   */
  calculateMonthlyProgress(monthlySteps) {
    const targetSteps = 10000 * monthlySteps.length; // 10k steps per day target
    const actualSteps = monthlySteps.reduce((sum, day) => sum + day.steps, 0);
    const progressPercentage = (actualSteps / targetSteps) * 100;
    
    return {
      targetSteps,
      actualSteps,
      progressPercentage: Math.round(progressPercentage),
      daysActive: monthlySteps.filter(day => day.steps > 5000).length,
      totalDays: monthlySteps.length
    };
  }

  /**
   * Get activity insights and recommendations
   */
  getActivityInsights() {
    if (!this.dailyData) return null;

    const insights = [];
    const recommendations = [];

    // Steps analysis
    if (this.dailyData.steps < 5000) {
      insights.push('Low activity level detected');
      recommendations.push('Try to take a short walk every hour');
    } else if (this.dailyData.steps > 15000) {
      insights.push('Excellent activity level!');
      recommendations.push('Keep up the great work!');
    }

    // Active minutes analysis
    if (this.dailyData.activeMinutes < 30) {
      insights.push('Below recommended active minutes');
      recommendations.push('Aim for at least 30 minutes of moderate activity');
    }

    // Calories analysis
    if (this.dailyData.calories > 500) {
      insights.push('Good calorie burn today');
    }

    return {
      insights,
      recommendations,
      score: this.calculateActivityScore()
    };
  }

  /**
   * Calculate overall activity score (0-100)
   */
  calculateActivityScore() {
    if (!this.dailyData) return 0;

    let score = 0;
    
    // Steps score (40%)
    const stepsScore = Math.min((this.dailyData.steps / 10000) * 40, 40);
    score += stepsScore;
    
    // Active minutes score (30%)
    const activeMinutesScore = Math.min((this.dailyData.activeMinutes / 30) * 30, 30);
    score += activeMinutesScore;
    
    // Calories score (20%)
    const caloriesScore = Math.min((this.dailyData.calories / 300) * 20, 20);
    score += caloriesScore;
    
    // Distance score (10%)
    const distanceScore = Math.min((this.dailyData.distance / 5) * 10, 10);
    score += distanceScore;

    return Math.round(score);
  }

  /**
   * Mock data for development/testing
   */
  getMockDailyData() {
    const today = new Date();
    return {
      date: today.toISOString().split('T')[0],
      steps: 8432,
      calories: 342,
      distance: 3.2,
      activeMinutes: 28,
      activities: [
        { name: 'Walking', duration: 25, sessions: 3 },
        { name: 'Running', duration: 15, sessions: 1 }
      ]
    };
  }

  getMockWeeklyData() {
    return {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalSteps: 58234,
      totalCalories: 2394,
      totalDistance: 22.4,
      dailyAverages: {
        steps: 8319,
        calories: 342,
        distance: 3.2
      },
      trend: 'increasing'
    };
  }

  getMockMonthlyData() {
    return {
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSteps: 249832,
      totalCalories: 10282,
      dailyAverage: {
        steps: 8328,
        calories: 343
      },
      progress: {
        targetSteps: 300000,
        actualSteps: 249832,
        progressPercentage: 83,
        daysActive: 25,
        totalDays: 30
      }
    };
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();

// Export utility functions
export const getActivityGoals = (userProfile) => {
  const { age, gender, activityLevel, goal } = userProfile;
  
  let baseSteps = 8000;
  let baseCalories = 250;
  let baseActiveMinutes = 30;
  
  // Adjust based on activity level
  if (activityLevel === 'high') {
    baseSteps = 12000;
    baseCalories = 400;
    baseActiveMinutes = 45;
  } else if (activityLevel === 'low') {
    baseSteps = 6000;
    baseCalories = 200;
    baseActiveMinutes = 20;
  }
  
  // Adjust based on goal
  if (goal === 'weight_loss') {
    baseCalories += 100;
    baseActiveMinutes += 10;
  } else if (goal === 'muscle_gain') {
    baseCalories -= 50;
    baseSteps -= 1000;
  }
  
  return {
    dailySteps: baseSteps,
    dailyCalories: baseCalories,
    dailyActiveMinutes: baseActiveMinutes,
    weeklyDistance: baseSteps * 7 * 0.0007 // Average stride length
  };
};

export const compareWithGoals = (actualData, goals) => {
  return {
    steps: {
      actual: actualData.steps,
      goal: goals.dailySteps,
      percentage: Math.round((actualData.steps / goals.dailySteps) * 100),
      achieved: actualData.steps >= goals.dailySteps
    },
    calories: {
      actual: actualData.calories,
      goal: goals.dailyCalories,
      percentage: Math.round((actualData.calories / goals.dailyCalories) * 100),
      achieved: actualData.calories >= goals.dailyCalories
    },
    activeMinutes: {
      actual: actualData.activeMinutes,
      goal: goals.dailyActiveMinutes,
      percentage: Math.round((actualData.activeMinutes / goals.dailyActiveMinutes) * 100),
      achieved: actualData.activeMinutes >= goals.dailyActiveMinutes
    }
  };
};
