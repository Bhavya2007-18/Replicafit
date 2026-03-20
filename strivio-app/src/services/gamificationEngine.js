/**
 * Strivio Gamification System
 * Comprehensive engagement and motivation system
 * Points, badges, achievements, challenges, and rewards
 */

class GamificationEngine {
  constructor() {
    this.userProgress = new Map();
    this.achievements = this.initializeAchievements();
    this.badges = this.initializeBadges();
    this.challenges = this.initializeChallenges();
    this.rewards = this.initializeRewards();
    this.leaderboards = new Map();
  }

  /**
   * Initialize user gamification profile
   */
  initializeUserProfile(userId, userProfile) {
    const profile = {
      userId,
      level: 1,
      experience: 0,
      points: 0,
      streak: 0,
      lastActiveDate: null,
      achievements: [],
      badges: [],
      currentChallenges: [],
      completedChallenges: [],
      stats: {
        totalWorkouts: 0,
        totalMinutes: 0,
        perfectWorkouts: 0,
        caloriesBurned: 0,
        exercisesCompleted: 0,
        formAccuracy: 0,
        consistency: 0
      },
      preferences: {
        notifications: true,
        shareProgress: false,
        competeWithFriends: false
      }
    };

    this.userProgress.set(userId, profile);
    return profile;
  }

  /**
   * Process workout completion and award points
   */
  processWorkoutCompletion(userId, workoutData) {
    const profile = this.getUserProfile(userId);
    if (!profile) return null;

    // Calculate workout score
    const workoutScore = this.calculateWorkoutScore(workoutData);
    const pointsEarned = Math.round(workoutScore * 10);
    const experienceEarned = Math.round(workoutScore * 5);

    // Update user stats
    profile.stats.totalWorkouts++;
    profile.stats.totalMinutes += workoutData.duration || 0;
    profile.stats.caloriesBurned += workoutData.calories || 0;
    profile.stats.exercisesCompleted += workoutData.exercises?.length || 0;
    
    // Update form accuracy (running average)
    const newAccuracy = workoutData.avgAccuracy || 0;
    profile.stats.formAccuracy = this.updateRunningAverage(
      profile.stats.formAccuracy, 
      newAccuracy, 
      profile.stats.totalWorkouts
    );

    // Check for perfect workout
    if (newAccuracy >= 90) {
      profile.stats.perfectWorkouts++;
      pointsEarned += 50; // Bonus for perfect workout
    }

    // Update streak
    this.updateStreak(profile);

    // Award points and experience
    profile.points += pointsEarned;
    profile.experience += experienceEarned;

    // Check for level up
    const levelUp = this.checkLevelUp(profile);

    // Check achievements
    const newAchievements = this.checkAchievements(profile, workoutData);

    // Check challenge progress
    const challengeUpdates = this.updateChallengeProgress(userId, workoutData);

    // Update leaderboards
    this.updateLeaderboards(userId, profile);

    return {
      pointsEarned,
      experienceEarned,
      levelUp,
      newAchievements,
      challengeUpdates,
      workoutScore,
      rank: this.getUserRank(userId)
    };
  }

  /**
   * Calculate workout score based on multiple factors
   */
  calculateWorkoutScore(workoutData) {
    let score = 0;

    // Base score for completion
    score += 50;

    // Accuracy bonus (0-30 points)
    const accuracy = workoutData.avgAccuracy || 0;
    score += (accuracy / 100) * 30;

    // Duration bonus (0-20 points)
    const duration = workoutData.duration || 0;
    if (duration >= 30) score += 20;
    else if (duration >= 20) score += 15;
    else if (duration >= 10) score += 10;

    // Exercise variety bonus (0-10 points)
    const exerciseCount = workoutData.exercises?.length || 0;
    if (exerciseCount >= 5) score += 10;
    else if (exerciseCount >= 3) score += 7;
    else if (exerciseCount >= 2) score += 5;

    // Intensity bonus (0-10 points)
    const intensity = workoutData.intensity || 'moderate';
    const intensityBonus = {
      low: 2,
      moderate: 5,
      high: 10
    };
    score += intensityBonus[intensity] || 5;

    // Fatigue management bonus (0-10 points)
    if (workoutData.fatigueManaged) {
      score += 10;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Update user streak
   */
  updateStreak(profile) {
    const today = new Date().toDateString();
    const lastActive = profile.lastActiveDate;

    if (!lastActive) {
      profile.streak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        profile.streak++;
      } else if (daysDiff > 1) {
        profile.streak = 1; // Reset streak
      }
      // If daysDiff === 0, same day, don't update streak
    }

    profile.lastActiveDate = today;
    profile.stats.consistency = this.calculateConsistency(profile);
  }

  /**
   * Calculate consistency score
   */
  calculateConsistency(profile) {
    // Consistency based on streak vs total workouts
    if (profile.stats.totalWorkouts === 0) return 0;
    
    const idealConsistency = profile.streak / profile.stats.totalWorkouts;
    return Math.round(idealConsistency * 100);
  }

  /**
   * Check and process level up
   */
  checkLevelUp(profile) {
    const currentLevel = profile.level;
    const requiredExp = this.getExperienceForLevel(currentLevel + 1);

    if (profile.experience >= requiredExp) {
      profile.level = currentLevel + 1;
      
      // Award level-up bonus
      const bonus = {
        points: 100 * profile.level,
        badge: this.getLevelBadge(profile.level),
        reward: this.getLevelReward(profile.level)
      };

      // Check for badge unlock
      if (bonus.badge && !profile.badges.includes(bonus.badge.id)) {
        profile.badges.push(bonus.badge.id);
      }

      return bonus;
    }

    return null;
  }

  /**
   * Get experience required for level
   */
  getExperienceForLevel(level) {
    // Exponential growth: 100 * (1.5 ^ (level - 1))
    return Math.round(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Check for new achievements
   */
  checkAchievements(profile, workoutData) {
    const newAchievements = [];

    this.achievements.forEach(achievement => {
      if (profile.achievements.includes(achievement.id)) return; // Already unlocked

      const isUnlocked = this.checkAchievementCriteria(achievement, profile, workoutData);
      if (isUnlocked) {
        profile.achievements.push(achievement.id);
        profile.points += achievement.points;
        newAchievements.push(achievement);
      }
    });

    return newAchievements;
  }

  /**
   * Check if achievement criteria is met
   */
  checkAchievementCriteria(achievement, profile, workoutData) {
    switch (achievement.type) {
      case 'workout_count':
        return profile.stats.totalWorkouts >= achievement.criteria.count;
      
      case 'streak':
        return profile.streak >= achievement.criteria.days;
      
      case 'accuracy':
        return workoutData.avgAccuracy >= achievement.criteria.accuracy;
      
      case 'duration':
        return (workoutData.duration || 0) >= achievement.criteria.minutes;
      
      case 'level':
        return profile.level >= achievement.criteria.level;
      
      case 'points':
        return profile.points >= achievement.criteria.points;
      
      case 'perfect_workouts':
        return profile.stats.perfectWorkouts >= achievement.criteria.count;
      
      case 'consistency':
        return profile.stats.consistency >= achievement.criteria.percentage;
      
      default:
        return false;
    }
  }

  /**
   * Initialize achievements system
   */
  initializeAchievements() {
    return [
      {
        id: 'first_workout',
        name: 'First Steps',
        description: 'Complete your first workout',
        icon: '🎯',
        type: 'workout_count',
        criteria: { count: 1 },
        points: 50,
        rarity: 'common'
      },
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Complete 7 workouts in a week',
        icon: '⚔️',
        type: 'workout_count',
        criteria: { count: 7 },
        points: 200,
        rarity: 'common'
      },
      {
        id: 'month_master',
        name: 'Month Master',
        description: 'Complete 30 workouts',
        icon: '🏆',
        type: 'workout_count',
        criteria: { count: 30 },
        points: 500,
        rarity: 'rare'
      },
      {
        id: 'streak_starter',
        name: 'Streak Starter',
        description: 'Maintain a 7-day workout streak',
        icon: '🔥',
        type: 'streak',
        criteria: { days: 7 },
        points: 300,
        rarity: 'common'
      },
      {
        id: 'streak_legend',
        name: 'Streak Legend',
        description: 'Maintain a 30-day workout streak',
        icon: '💎',
        type: 'streak',
        criteria: { days: 30 },
        points: 1000,
        rarity: 'epic'
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 95% accuracy in a workout',
        icon: '💯',
        type: 'accuracy',
        criteria: { accuracy: 95 },
        points: 150,
        rarity: 'rare'
      },
      {
        id: 'endurance_champ',
        name: 'Endurance Champion',
        description: 'Complete a 60-minute workout',
        icon: '⏱️',
        type: 'duration',
        criteria: { minutes: 60 },
        points: 250,
        rarity: 'uncommon'
      },
      {
        id: 'level_10',
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: '⭐',
        type: 'level',
        criteria: { level: 10 },
        points: 400,
        rarity: 'uncommon'
      },
      {
        id: 'point_master',
        name: 'Point Master',
        description: 'Earn 5000 total points',
        icon: '💰',
        type: 'points',
        criteria: { points: 5000 },
        points: 200,
        rarity: 'rare'
      },
      {
        id: 'perfect_10',
        name: 'Perfect 10',
        description: 'Complete 10 perfect workouts (90%+ accuracy)',
        icon: '🎖️',
        type: 'perfect_workouts',
        criteria: { count: 10 },
        points: 600,
        rarity: 'epic'
      },
      {
        id: 'consistency_king',
        name: 'Consistency King',
        description: 'Maintain 80% workout consistency',
        icon: '👑',
        type: 'consistency',
        criteria: { percentage: 80 },
        points: 350,
        rarity: 'rare'
      }
    ];
  }

  /**
   * Initialize badges system
   */
  initializeBadges() {
    return [
      {
        id: 'bronze_athlete',
        name: 'Bronze Athlete',
        description: 'Reach level 5',
        icon: '🥉',
        requirement: { level: 5 },
        category: 'level'
      },
      {
        id: 'silver_athlete',
        name: 'Silver Athlete',
        description: 'Reach level 15',
        icon: '🥈',
        requirement: { level: 15 },
        category: 'level'
      },
      {
        id: 'gold_athlete',
        name: 'Gold Athlete',
        description: 'Reach level 25',
        icon: '🥇',
        requirement: { level: 25 },
        category: 'level'
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete 10 morning workouts',
        icon: '🌅',
        requirement: { morningWorkouts: 10 },
        category: 'habit'
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete 10 evening workouts',
        icon: '🌙',
        requirement: { eveningWorkouts: 10 },
        category: 'habit'
      },
      {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Complete 20 weekend workouts',
        icon: '🎉',
        requirement: { weekendWorkouts: 20 },
        category: 'habit'
      }
    ];
  }

  /**
   * Initialize challenges system
   */
  initializeChallenges() {
    return [
      {
        id: 'weekly_burn',
        name: 'Weekly Burn Challenge',
        description: 'Burn 2000 calories this week',
        type: 'weekly',
        duration: 7,
        criteria: { calories: 2000 },
        reward: { points: 500, experience: 250 },
        difficulty: 'medium'
      },
      {
        id: 'accuracy_master',
        name: 'Accuracy Master',
        description: 'Maintain 85%+ average accuracy for 5 workouts',
        type: 'weekly',
        duration: 7,
        criteria: { avgAccuracy: 85, workouts: 5 },
        reward: { points: 400, experience: 200 },
        difficulty: 'hard'
      },
      {
        id: 'streak_keeper',
        name: 'Streak Keeper',
        description: 'Don\'t break your workout streak for 14 days',
        type: 'duration',
        duration: 14,
        criteria: { minStreak: 14 },
        reward: { points: 600, experience: 300 },
        difficulty: 'medium'
      },
      {
        id: 'exercise_explorer',
        name: 'Exercise Explorer',
        description: 'Try 10 different exercises this month',
        type: 'monthly',
        duration: 30,
        criteria: { uniqueExercises: 10 },
        reward: { points: 350, experience: 175 },
        difficulty: 'easy'
      },
      {
        id: 'marathon_month',
        name: 'Marathon Month',
        description: 'Complete 20 workouts this month',
        type: 'monthly',
        duration: 30,
        criteria: { workouts: 20 },
        reward: { points: 800, experience: 400 },
        difficulty: 'hard'
      }
    ];
  }

  /**
   * Initialize rewards system
   */
  initializeRewards() {
    return [
      {
        id: 'extra_energy',
        name: 'Extra Energy Boost',
        description: 'Unlock a premium workout plan',
        cost: 1000,
        type: 'content',
        category: 'workout'
      },
      {
        id: 'nutrition_guide',
        name: 'Premium Nutrition Guide',
        description: 'Get personalized meal plans',
        cost: 1500,
        type: 'content',
        category: 'nutrition'
      },
      {
        id: 'custom_badge',
        name: 'Custom Badge',
        description: 'Create your own achievement badge',
        cost: 2000,
        type: 'cosmetic',
        category: 'personalization'
      },
      {
        id: 'profile_theme',
        name: 'Premium Profile Theme',
        description: 'Unlock exclusive profile themes',
        cost: 800,
        type: 'cosmetic',
        category: 'personalization'
      },
      {
        id: 'workout_music',
        name: 'Workout Music Pack',
        description: 'Premium workout music playlists',
        cost: 500,
        type: 'content',
        category: 'entertainment'
      }
    ];
  }

  /**
   * Update challenge progress
   */
  updateChallengeProgress(userId, workoutData) {
    const profile = this.getUserProfile(userId);
    const updates = [];

    // Auto-enroll in relevant challenges
    this.autoEnrollChallenges(userId, profile);

    // Update progress for active challenges
    profile.currentChallenges.forEach(challenge => {
      const challengeDef = this.challenges.find(c => c.id === challenge.id);
      if (!challengeDef) return;

      const progress = this.calculateChallengeProgress(challengeDef, challenge, workoutData, profile);
      challenge.progress = progress;

      // Check if challenge is completed
      if (progress.percentage >= 100) {
        this.completeChallenge(userId, challenge.id);
        updates.push({
          challenge: challengeDef,
          completed: true,
          reward: challengeDef.reward
        });
      } else {
        updates.push({
          challenge: challengeDef,
          progress: progress,
          completed: false
        });
      }
    });

    return updates;
  }

  /**
   * Auto-enroll user in relevant challenges
   */
  autoEnrollChallenges(userId, profile) {
    this.challenges.forEach(challenge => {
      // Check if user is already enrolled or completed
      const isEnrolled = profile.currentChallenges.some(c => c.id === challenge.id);
      const isCompleted = profile.completedChallenges.some(c => c.id === challenge.id);

      if (!isEnrolled && !isCompleted) {
        // Auto-enroll based on user level and preferences
        if (this.shouldAutoEnroll(challenge, profile)) {
          profile.currentChallenges.push({
            id: challenge.id,
            startDate: new Date().toISOString(),
            progress: { percentage: 0, current: 0, target: 0 }
          });
        }
      }
    });
  }

  /**
   * Check if user should be auto-enrolled in challenge
   */
  shouldAutoEnroll(challenge, profile) {
    // Only auto-enroll in easy and medium challenges
    if (challenge.difficulty === 'hard') return false;

    // Check user level
    if (challenge.type === 'weekly' && profile.level >= 3) return true;
    if (challenge.type === 'monthly' && profile.level >= 5) return true;

    return false;
  }

  /**
   * Calculate challenge progress
   */
  calculateChallengeProgress(challenge, userChallenge, workoutData, profile) {
    const criteria = challenge.criteria;
    let current = 0;
    let target = 0;

    switch (challenge.id) {
      case 'weekly_burn':
        current = this.getWeeklyCalories(profile, userChallenge.startDate);
        target = criteria.calories;
        break;

      case 'accuracy_master':
        // This would need tracking of recent workouts
        current = userChallenge.progress?.current || 0;
        target = criteria.workouts;
        break;

      case 'streak_keeper':
        current = profile.streak;
        target = criteria.minStreak;
        break;

      case 'exercise_explorer':
        current = userChallenge.progress?.current || 0;
        target = criteria.uniqueExercises;
        break;

      case 'marathon_month':
        current = this.getMonthlyWorkouts(profile, userChallenge.startDate);
        target = criteria.workouts;
        break;

      default:
        current = 0;
        target = 100;
    }

    const percentage = Math.min(Math.round((current / target) * 100), 100);

    return {
      current,
      target,
      percentage,
      completed: percentage >= 100
    };
  }

  /**
   * Complete challenge and award rewards
   */
  completeChallenge(userId, challengeId) {
    const profile = this.getUserProfile(userId);
    const challengeIndex = profile.currentChallenges.findIndex(c => c.id === challengeId);
    
    if (challengeIndex === -1) return;

    const challenge = profile.currentChallenges[challengeIndex];
    const challengeDef = this.challenges.find(c => c.id === challengeId);

    // Remove from current challenges
    profile.currentChallenges.splice(challengeIndex, 1);

    // Add to completed challenges
    profile.completedChallenges.push({
      id: challengeId,
      completedDate: new Date().toISOString(),
      progress: challenge.progress
    });

    // Award rewards
    if (challengeDef.reward) {
      profile.points += challengeDef.reward.points || 0;
      profile.experience += challengeDef.reward.experience || 0;
    }
  }

  /**
   * Update leaderboards
   */
  updateLeaderboards(userId, profile) {
    // Global points leaderboard
    this.updateLeaderboard('global_points', userId, profile.points);

    // Weekly points leaderboard
    const weeklyPoints = this.getWeeklyPoints(userId);
    this.updateLeaderboard('weekly_points', userId, weeklyPoints);

    // Streak leaderboard
    this.updateLeaderboard('streak', userId, profile.streak);

    // Level leaderboard
    this.updateLeaderboard('level', userId, profile.level);
  }

  /**
   * Update specific leaderboard
   */
  updateLeaderboard(leaderboardId, userId, score) {
    if (!this.leaderboards.has(leaderboardId)) {
      this.leaderboards.set(leaderboardId, []);
    }

    const leaderboard = this.leaderboards.get(leaderboardId);
    const existingEntry = leaderboard.find(entry => entry.userId === userId);

    if (existingEntry) {
      existingEntry.score = score;
      existingEntry.lastUpdated = new Date().toISOString();
    } else {
      leaderboard.push({
        userId,
        score,
        lastUpdated: new Date().toISOString()
      });
    }

    // Sort and keep top 100
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 100) {
      leaderboard.splice(100);
    }
  }

  /**
   * Get user rank on leaderboards
   */
  getUserRank(userId) {
    const ranks = {};

    this.leaderboards.forEach((leaderboard, leaderboardId) => {
      const index = leaderboard.findIndex(entry => entry.userId === userId);
      ranks[leaderboardId] = index === -1 ? null : index + 1;
    });

    return ranks;
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    return this.userProgress.get(userId);
  }

  /**
   * Helper methods for calculations
   */
  updateRunningAverage(currentAvg, newValue, count) {
    if (count === 1) return newValue;
    return Math.round(((currentAvg * (count - 1)) + newValue) / count);
  }

  getLevelBadge(level) {
    if (level >= 25) return { id: 'gold_athlete', name: 'Gold Athlete' };
    if (level >= 15) return { id: 'silver_athlete', name: 'Silver Athlete' };
    if (level >= 5) return { id: 'bronze_athlete', name: 'Bronze Athlete' };
    return null;
  }

  getLevelReward(level) {
    return {
      points: 100 * level,
      experience: 50 * level
    };
  }

  getWeeklyCalories(profile, startDate) {
    // This would integrate with actual workout data
    return profile.stats.caloriesBurned || 0;
  }

  getMonthlyWorkouts(profile, startDate) {
    // This would integrate with actual workout data
    return profile.stats.totalWorkouts || 0;
  }

  getWeeklyPoints(userId) {
    // This would calculate points earned in the current week
    const profile = this.getUserProfile(userId);
    return profile ? profile.points : 0;
  }

  /**
   * Get available rewards for user
   */
  getAvailableRewards(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) return [];

    return this.rewards.filter(reward => reward.cost <= profile.points);
  }

  /**
   * Redeem reward
   */
  redeemReward(userId, rewardId) {
    const profile = this.getUserProfile(userId);
    const reward = this.rewards.find(r => r.id === rewardId);

    if (!profile || !reward || profile.points < reward.cost) {
      return { success: false, message: 'Insufficient points' };
    }

    profile.points -= reward.cost;
    
    // Add to user's redeemed rewards
    if (!profile.redeemedRewards) {
      profile.redeemedRewards = [];
    }
    profile.redeemedRewards.push({
      rewardId,
      redeemedDate: new Date().toISOString()
    });

    return { success: true, reward };
  }

  /**
   * Get gamification summary
   */
  getGamificationSummary(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) return null;

    const nextLevelExp = this.getExperienceForLevel(profile.level + 1);
    const currentLevelExp = this.getExperienceForLevel(profile.level);
    const progressToNext = ((profile.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

    return {
      level: profile.level,
      experience: profile.experience,
      experienceToNext: nextLevelExp - profile.experience,
      progressToNext: Math.round(progressToNext),
      points: profile.points,
      streak: profile.streak,
      rank: this.getUserRank(userId),
      achievements: profile.achievements.length,
      badges: profile.badges.length,
      activeChallenges: profile.currentChallenges.length,
      completedChallenges: profile.completedChallenges.length,
      stats: profile.stats
    };
  }
}

// Export singleton instance
export const gamificationEngine = new GamificationEngine();

// Export utility functions
export const calculateWorkoutIntensity = (workoutData) => {
  const factors = {
    duration: workoutData.duration || 0,
    accuracy: workoutData.avgAccuracy || 0,
    exercises: workoutData.exercises?.length || 0,
    heartRate: workoutData.avgHeartRate || 0
  };

  let intensity = 0;
  
  // Duration factor
  if (factors.duration >= 45) intensity += 3;
  else if (factors.duration >= 30) intensity += 2;
  else if (factors.duration >= 15) intensity += 1;

  // Accuracy factor
  if (factors.accuracy >= 90) intensity += 2;
  else if (factors.accuracy >= 75) intensity += 1;

  // Exercise variety factor
  if (factors.exercises >= 5) intensity += 2;
  else if (factors.exercises >= 3) intensity += 1;

  // Heart rate factor (if available)
  if (factors.heartRate >= 150) intensity += 2;
  else if (factors.heartRate >= 130) intensity += 1;

  if (intensity >= 6) return 'high';
  if (intensity >= 4) return 'moderate';
  return 'low';
};

export const getMotivationalMessage = (achievement, userProfile) => {
  const messages = {
    first_workout: [
      "Great start! You've taken the first step on your fitness journey! 🎯",
      "Welcome to the club! Your first workout is complete! 💪"
    ],
    streak_starter: [
      `${userProfile.streak} days strong! You're building a great habit! 🔥`,
      "Amazing consistency! Keep that streak going! ⚡"
    ],
    perfectionist: [
      "Perfect form! Your dedication to quality is impressive! 💯",
      "Accuracy master! Your attention to detail pays off! 🎖️"
    ],
    level_up: [
      `Level ${userProfile.level} unlocked! You're getting stronger! ⭐`,
      "New level achieved! Your hard work is paying off! 🚀"
    ]
  };

  const categoryMessages = messages[achievement.type] || [
    "Achievement unlocked! You're crushing it! 🏆",
    "Great job! Another milestone reached! ✨"
  ];

  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};
