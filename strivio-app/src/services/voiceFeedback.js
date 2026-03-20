/**
 * Strivio Enhanced Voice Feedback Engine
 * Intelligent, context-aware audio coaching system
 * Personalized voice coaching with emotional intelligence
 */

import * as Speech from 'expo-speech';

class EnhancedVoiceEngine {
  constructor() {
    this.isEnabled = true;
    this.voiceSettings = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      language: 'en-US',
      voice: null
    };
    this.lastSpokenTime = 0;
    this.minInterval = 3000; // 3 seconds minimum between messages
    this.context = {
      currentExercise: null,
      repCount: 0,
      setCount: 0,
      workoutPhase: 'warmup',
      userFatigue: 'low',
      recentFeedback: [],
      userProfile: null
    };
    this.feedbackHistory = [];
    this.personalization = {
      coachingStyle: 'motivational', // motivational, technical, encouraging
      feedbackFrequency: 'balanced', // minimal, balanced, detailed
      voiceTone: 'friendly', // friendly, professional, energetic
      language: 'en'
    };
  }

  /**
   * Initialize voice engine with user preferences
   */
  async initialize(userPreferences = {}) {
    try {
      // Get available voices
      const voices = await Speech.getVoicesAsync();
      
      // Set user preferences
      this.personalization = { ...this.personalization, ...userPreferences };
      this.voiceSettings = { ...this.voiceSettings, ...userPreferences.voiceSettings };

      // Select appropriate voice
      if (voices.length > 0) {
        const preferredVoice = this.selectBestVoice(voices);
        this.voiceSettings.voice = preferredVoice;
      }

      // Test speech synthesis
      await this.speak("Voice coaching activated", { priority: 'high', test: true });
      
      return { success: true, voice: this.voiceSettings.voice };
    } catch (error) {
      console.error('Voice engine initialization failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Select best voice for coaching
   */
  selectBestVoice(voices) {
    // Filter by language preference
    const languageCode = this.personalization.language === 'es' ? 'es' : 'en';
    const compatibleVoices = voices.filter(voice => 
      voice.language.startsWith(languageCode)
    );

    if (compatibleVoices.length === 0) {
      return voices[0]; // Fallback to first available voice
    }

    // Prefer female voices for coaching (generally perceived as more encouraging)
    const femaleVoices = compatibleVoices.filter(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman')
    );

    if (femaleVoices.length > 0) {
      return femaleVoices[0];
    }

    return compatibleVoices[0];
  }

  /**
   * Main feedback method - intelligent context-aware coaching
   */
  async provideFeedback(feedbackType, data = {}) {
    if (!this.isEnabled) return;

    // Update context
    this.updateContext(data);

    // Generate intelligent feedback
    const feedback = this.generateIntelligentFeedback(feedbackType, data);
    
    if (!feedback || !feedback.message) return;

    // Check if we should speak (throttling and relevance)
    if (!this.shouldSpeak(feedback)) return;

    // Speak the feedback
    await this.speak(feedback.message, {
      priority: feedback.priority || 'medium',
      context: feedback.context,
      emotion: feedback.emotion
    });

    // Log feedback for learning
    this.logFeedback(feedback);
  }

  /**
   * Generate intelligent, context-aware feedback
   */
  generateIntelligentFeedback(feedbackType, data) {
    const { coachingStyle, feedbackFrequency } = this.personalization;
    const { userFatigue, repCount, setCount, workoutPhase } = this.context;

    switch (feedbackType) {
      case 'form_correction':
        return this.generateFormFeedback(data, coachingStyle);
      
      case 'rep_counting':
        return this.generateRepCountingFeedback(data, coachingStyle);
      
      case 'encouragement':
        return this.generateEncouragement(data, coachingStyle, userFatigue);
      
      case 'fatigue_warning':
        return this.generateFatigueFeedback(data, coachingStyle, userFatigue);
      
      case 'workout_phase':
        return this.generatePhaseFeedback(data, workoutPhase, coachingStyle);
      
      case 'achievement':
        return this.generateAchievementFeedback(data, coachingStyle);
      
      case 'technique_tip':
        return this.generateTechniqueFeedback(data, coachingStyle);
      
      case 'breathing_reminder':
        return this.generateBreathingFeedback(data, coachingStyle);
      
      default:
        return null;
    }
  }

  /**
   * Generate form correction feedback
   */
  generateFormFeedback(data, coachingStyle) {
    const { issue, severity, exercise } = data;
    
    const feedbackTemplates = {
      motivational: {
        high: [
          `Let's fix that ${issue}. You've got this! Focus on form.`,
          `Almost perfect! Just adjust your ${issue} slightly. You're doing great!`,
          `Great effort! Let's perfect that ${issue}. You're so close!`
        ],
        medium: [
          `Good form! Let's work on that ${issue}. You're improving!`,
          `Nice work! Pay attention to your ${issue}. Keep it up!`,
          `Solid effort! Small adjustment needed for ${issue}. You can do it!`
        ],
        low: [
          `Good job! Minor ${issue} adjustment. You're on the right track!`,
          `Great start! Tiny ${issue} tweak. Looking strong!`,
          `Excellent effort! Small ${issue} fix. You're crushing it!`
        ]
      },
      technical: {
        high: [
          `Form alert: ${issue}. Correct immediately to prevent injury.`,
          `Critical: ${issue} detected. Adjust your position now.`,
          `Technique issue: ${issue}. Fix this before continuing.`
        ],
        medium: [
          `Form check: ${issue}. Adjust your position.`,
          `Technique note: ${issue}. Make this correction.`,
          `Posture alert: ${issue}. Modify your stance.`
        ],
        low: [
          `Minor ${issue}. Slight adjustment recommended.`,
          `Form tip: ${issue}. Small correction needed.`,
          `Technique note: ${issue}. Minor tweak suggested.`
        ]
      },
      encouraging: {
        high: [
          `I see you're working on ${issue}. That's okay! Let's fix it together! 💪`,
          `Hey, ${issue} happens! Let's correct it and keep going! You've got this!`,
          `No worries about ${issue}! Let's adjust and you'll be perfect! ✨`
        ],
        medium: [
          `Good catch on ${issue}! Let's fix it and continue! You're learning! 🌟`,
          `Nice awareness of ${issue}! Small adjustment and you're golden! 🎯`,
          `Great job noticing ${issue}! Let's correct and keep that energy! ⚡`
        ],
        low: [
          `Almost perfect! Just a tiny ${issue} adjustment! You're doing amazing! 🌈`,
          `So close! Small ${issue} fix and you'll be flawless! Keep shining! ✨`,
          `Excellent work! Minor ${issue} tweak and you're there! You rock! 🎸`
        ]
      }
    };

    const templates = feedbackTemplates[coachingStyle]?.[severity] || feedbackTemplates.motivational.medium;
    const message = templates[Math.floor(Math.random() * templates.length)];

    return {
      message,
      priority: severity === 'high' ? 'high' : 'medium',
      context: 'form_correction',
      emotion: this.getEmotionForSeverity(severity, coachingStyle)
    };
  }

  /**
   * Generate rep counting feedback
   */
  generateRepCountingFeedback(data, coachingStyle) {
    const { currentRep, targetReps, setTime } = data;
    const isLastRep = currentRep === targetReps;
    const isHalfway = currentRep === Math.floor(targetReps / 2);

    if (isLastRep) {
      const completionMessages = {
        motivational: [
          `Excellent! ${targetReps} reps completed! Great set! 💪`,
          `Perfect! ${targetReps} reps! You're crushing it! 🔥`,
          `Amazing work! ${targetReps} reps! Strong finish! ⭐`
        ],
        technical: [
          `Set complete. ${targetReps} reps executed.`,
          `${targetReps} reps finished. Maintain form.`,
          `Set done. ${targetReps} repetitions completed.`
        ],
        encouraging: [
          `You did it! ${targetReps} beautiful reps! So proud of you! 🌟`,
          `Fantastic! ${targetReps} reps! You're absolutely incredible! ✨`,
          `Wonderful job! ${targetReps} reps! Your dedication shows! 🎯`
        ]
      };
      
      const messages = completionMessages[coachingStyle] || completionMessages.motivational;
      return {
        message: messages[Math.floor(Math.random() * messages.length)],
        priority: 'high',
        context: 'completion',
        emotion: 'celebration'
      };
    }

    if (isHalfway && coachingStyle !== 'technical') {
      const halfwayMessages = {
        motivational: [
          `Halfway there! ${currentRep} reps! Keep pushing! 💪`,
          `Nice work! ${currentRep} reps! You've got this! 🔥`,
          `Great pace! ${currentRep} reps! Stay strong! ⭐`
        ],
        encouraging: [
          `You're doing amazing! ${currentRep} reps! Keep that energy! 🌟`,
          `Looking so strong! ${currentRep} reps! You're unstoppable! ✨`,
          `Fantastic form! ${currentRep} reps! Keep going! 🎯`
        ]
      };
      
      const messages = halfwayMessages[coachingStyle] || halfwayMessages.motivational;
      return {
        message: messages[Math.floor(Math.random() * messages.length)],
        priority: 'low',
        context: 'progress',
        emotion: 'encouragement'
      };
    }

    return null;
  }

  /**
   * Generate encouragement feedback
   */
  generateEncouragement(data, coachingStyle, userFatigue) {
    const { workoutDuration, caloriesBurned, exercisesCompleted } = data;
    
    const encouragementTemplates = {
      motivational: {
        low: [
          "Great energy! You're building momentum! 💪",
          "Strong start! Keep that intensity! 🔥",
          "Excellent pace! You're on fire! ⭐"
        ],
        moderate: [
          "Pushing through! That's the spirit! 💪",
          "Tough but you're handling it! Stay strong! 🔥",
          "Great effort! Don't give up now! ⭐"
        ],
        high: [
          "Incredible determination! You're almost there! 💪",
          "Amazing resilience! Finish strong! 🔥",
          "Outstanding effort! You've got this! ⭐"
        ]
      },
      encouraging: {
        low: [
          "You're doing so well! I'm proud of you! 🌟",
          "Beautiful form! You're shining! ✨",
          "Wonderful energy! Keep glowing! 🌈"
        ],
        moderate: [
          "I believe in you! You're doing amazing! 🌟",
          "You've got this! Stay with it! ✨",
          "So proud of your effort! Keep going! 🎯"
        ],
        high: [
          "This is tough but you're tougher! I'm here for you! 🌟",
          "Breathe! You've got the strength! I'm cheering! ✨",
          "Almost there! I'm so impressed by you! 🎯"
        ]
      }
    };

    const templates = encouragementTemplates[coachingStyle]?.[userFatigue] || encouragementTemplates.motivational.low;
    const message = templates[Math.floor(Math.random() * templates.length)];

    return {
      message,
      priority: 'medium',
      context: 'encouragement',
      emotion: userFatigue === 'high' ? 'supportive' : 'energetic'
    };
  }

  /**
   * Generate fatigue warning feedback
   */
  generateFatigueFeedback(data, coachingStyle, userFatigue) {
    const { fatigueScore, recommendations } = data;
    
    if (userFatigue === 'high') {
      const fatigueMessages = {
        motivational: [
          "Fatigue detected. Consider reducing intensity. Smart training! 💪",
          "Your body needs a break. Let's adjust and continue safely! 🔥",
          "Listen to your body. Smart recovery is strength! ⭐"
        ],
        technical: [
          "High fatigue detected. Reduce weight or take rest.",
          "Fatigue level high. Modify intensity immediately.",
          "Recovery needed. Decrease workout intensity."
        ],
        encouraging: [
          "It's okay to feel tired! Let's take care of you! 🌟",
          "Your body is working hard! Let's give it some love! ✨",
          "Rest is productive! Let's recover together! 🎯"
        ]
      };

      const messages = fatigueMessages[coachingStyle] || fatigueMessages.motivational;
      return {
        message: messages[Math.floor(Math.random() * messages.length)],
        priority: 'high',
        context: 'fatigue_warning',
        emotion: 'concerned'
      };
    }

    return null;
  }

  /**
   * Generate workout phase feedback
   */
  generatePhaseFeedback(data, workoutPhase, coachingStyle) {
    const phaseMessages = {
      warmup: {
        motivational: [
          "Warmup complete! Body ready! Let's go! 💪",
          "Great warmup! Muscles activated! Time to shine! 🔥",
          "Perfect prep! You're ready to crush it! ⭐"
        ],
        technical: [
          "Warmup complete. Beginning main workout.",
          "Preparation finished. Starting exercises.",
          "Warmup done. Proceeding to workout."
        ],
        encouraging: [
          "Beautiful warmup! You're ready for magic! 🌟",
          "Perfect preparation! Let's make amazing happen! ✨",
          "Wonderful start! Ready for incredible things! 🎯"
        ]
      },
      main: {
        motivational: [
          "Main workout! Let's push limits! 💪",
          "Time to shine! Give it your all! 🔥",
          "Main event! Show your strength! ⭐"
        ],
        technical: [
          "Main workout initiated.",
          "Beginning primary exercises.",
          "Starting main training block."
        ],
        encouraging: [
          "This is where magic happens! You've got this! 🌟",
          "Time to be amazing! I believe in you! ✨",
          "Let's create something incredible! Let's go! 🎯"
        ]
      },
      cooldown: {
        motivational: [
          "Cooldown! Great job today! Recovery time! 💪",
          "Excellent work! Let's recover properly! 🔥",
          "Workout done! Smart recovery begins! ⭐"
        ],
        technical: [
          "Cooldown phase. Begin recovery.",
          "Workout complete. Start recovery.",
          "Initiating cooldown routine."
        ],
        encouraging: [
          "Amazing workout! Let's treat your body well! 🌟",
          "You were incredible! Time for gentle recovery! ✨",
          "Fantastic session! Let's recover with love! 🎯"
        ]
      }
    };

    const messages = phaseMessages[workoutPhase]?.[coachingStyle] || phaseMessages.main.motivational;
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      message,
      priority: 'medium',
      context: 'phase_transition',
      emotion: workoutPhase === 'main' ? 'energetic' : 'calm'
    };
  }

  /**
   * Generate achievement feedback
   */
  generateAchievementFeedback(data, coachingStyle) {
    const { achievement, milestone } = data;
    
    const achievementMessages = {
      motivational: [
        `Achievement unlocked: ${achievement}! Outstanding work! 💪`,
        `Milestone reached: ${milestone}! You're incredible! 🔥`,
        `Goal achieved: ${achievement}! Keep crushing it! ⭐`
      ],
      technical: [
        `Achievement: ${achievement} completed.`,
        `Milestone: ${milestone} reached.`,
        `Objective: ${achievement} accomplished.`
      ],
      encouraging: [
        `You did it! ${achievement}! I'm so proud of you! 🌟`,
        `Amazing! ${milestone}! You're absolutely incredible! ✨`,
        `Wonderful! ${achievement}! Your dedication shines! 🎯`
      ]
    };

    const messages = achievementMessages[coachingStyle] || achievementMessages.motivational;
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      message,
      priority: 'high',
      context: 'achievement',
      emotion: 'celebration'
    };
  }

  /**
   * Generate technique feedback
   */
  generateTechniqueFeedback(data, coachingStyle) {
    const { tip, exercise } = data;
    
    const techniqueMessages = {
      motivational: [
        `Pro tip: ${tip}. This will level up your form! 💪`,
        `Technique boost: ${tip}. Perfect your movement! 🔥`,
        `Form enhancer: ${tip}. Elevate your exercise! ⭐`
      ],
      technical: [
        `Technique: ${tip}. Apply to improve form.`,
        `Form guidance: ${tip}. Implement for better execution.`,
        `Movement cue: ${tip}. Use for optimal technique.`
      ],
      encouraging: [
        `Here's a secret: ${tip}. You'll be amazing! 🌟`,
        `Magic tip: ${tip}. Watch yourself shine! ✨`,
        `Insider advice: ${tip}. You're going to love it! 🎯`
      ]
    };

    const messages = techniqueMessages[coachingStyle] || techniqueMessages.motivational;
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      message,
      priority: 'low',
      context: 'technique_tip',
      emotion: 'helpful'
    };
  }

  /**
   * Generate breathing feedback
   */
  generateBreathingFeedback(data, coachingStyle) {
    const breathingMessages = {
      motivational: [
        "Remember to breathe! Controlled breathing = power! 💪",
        "Focus on breathing! It fuels your strength! 🔥",
        "Breathe with purpose! Oxygen = energy! ⭐"
      ],
      technical: [
        "Maintain proper breathing pattern.",
        "Focus on controlled breathing.",
        "Synchronize breath with movement."
      ],
      encouraging: [
        "Beautiful breathing! You're in tune with your body! 🌟",
        "Perfect rhythm! Your breath is your power! ✨",
        "Wonderful breathing! You're flowing beautifully! 🎯"
      ]
    };

    const messages = breathingMessages[coachingStyle] || breathingMessages.motivational;
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      message,
      priority: 'low',
      context: 'breathing_reminder',
      emotion: 'calm'
    };
  }

  /**
   * Check if message should be spoken
   */
  shouldSpeak(feedback) {
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastSpokenTime;
    
    // Respect minimum interval
    if (timeSinceLastMessage < this.minInterval && feedback.priority !== 'high') {
      return false;
    }

    // Check for recent similar feedback
    const recentSimilar = this.feedbackHistory.slice(-5).find(log => 
      log.context === feedback.context && 
      (now - log.timestamp) < 10000 // 10 seconds
    );

    if (recentSimilar && feedback.priority !== 'high') {
      return false;
    }

    return true;
  }

  /**
   * Speak message with enhanced settings
   */
  async speak(text, options = {}) {
    if (!this.isEnabled || options.test) {
      if (options.test) {
        console.log('Voice test:', text);
      }
      return;
    }

    try {
      const speechOptions = {
        ...this.voiceSettings,
        ...options
      };

      await Speech.speak(text, speechOptions);
      this.lastSpokenTime = Date.now();
      
      return { success: true, text, options: speechOptions };
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      return { success: false, error, text };
    }
  }

  /**
   * Update context for intelligent feedback
   */
  updateContext(data) {
    this.context = { ...this.context, ...data };
  }

  /**
   * Get emotion for severity and coaching style
   */
  getEmotionForSeverity(severity, coachingStyle) {
    const emotionMap = {
      motivational: {
        high: 'urgent',
        medium: 'motivated',
        low: 'encouraging'
      },
      technical: {
        high: 'serious',
        medium: 'informative',
        low: 'neutral'
      },
      encouraging: {
        high: 'supportive',
        medium: 'caring',
        low: 'gentle'
      }
    };

    return emotionMap[coachingStyle]?.[severity] || 'neutral';
  }

  /**
   * Log feedback for learning and improvement
   */
  logFeedback(feedback) {
    this.feedbackHistory.push({
      ...feedback,
      timestamp: Date.now(),
      context: { ...this.context }
    });

    // Keep only last 100 feedback entries
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory = this.feedbackHistory.slice(-100);
    }
  }

  /**
   * Update voice settings
   */
  updateVoiceSettings(newSettings) {
    this.voiceSettings = { ...this.voiceSettings, ...newSettings };
  }

  /**
   * Update personalization preferences
   */
  updatePersonalization(newPreferences) {
    this.personalization = { ...this.personalization, ...newPreferences };
  }

  /**
   * Enable/disable voice feedback
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Get feedback analytics
   */
  getFeedbackAnalytics() {
    const analytics = {
      totalFeedback: this.feedbackHistory.length,
      feedbackByType: {},
      feedbackByContext: {},
      feedbackByEmotion: {},
      averageInterval: 0,
      mostUsedContext: null
    };

    if (this.feedbackHistory.length === 0) return analytics;

    // Analyze feedback patterns
    this.feedbackHistory.forEach(log => {
      analytics.feedbackByType[log.context] = (analytics.feedbackByType[log.context] || 0) + 1;
      analytics.feedbackByEmotion[log.emotion] = (analytics.feedbackByEmotion[log.emotion] || 0) + 1;
    });

    // Find most used context
    analytics.mostUsedContext = Object.entries(analytics.feedbackByContext)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Calculate average interval
    if (this.feedbackHistory.length > 1) {
      const intervals = [];
      for (let i = 1; i < this.feedbackHistory.length; i++) {
        intervals.push(this.feedbackHistory[i].timestamp - this.feedbackHistory[i-1].timestamp);
      }
      analytics.averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    return analytics;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      voiceSettings: this.voiceSettings,
      personalization: this.personalization,
      context: this.context,
      analytics: this.getFeedbackAnalytics()
    };
  }
}

// Export singleton instance
export const enhancedVoiceEngine = new EnhancedVoiceEngine();

// Export utility functions
export const createWorkoutNarrative = (workoutPlan, userProfile) => {
  const narrative = {
    welcome: `Welcome ${userProfile.name}! Ready for your ${workoutPlan.goal} workout?`,
    warmup: "Let's warm up those muscles and prepare your body!",
    main: "Time for the main workout! Give it your all!",
    cooldown: "Great job! Let's cool down and recover properly.",
    completion: "Workout complete! You were absolutely amazing today!"
  };

  return narrative;
};

export const getMotivationalQuotes = () => {
  return [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "Success starts with self-discipline.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Don't stop when you're tired. Stop when you're done.",
    "Sore today, strong tomorrow.",
    "The hardest lift is lifting your butt off the couch.",
    "Your only limit is you.",
    "Push yourself because no one else is going to do it for you.",
    "Great things never come from comfort zones."
  ];
};

// Legacy exports for backward compatibility
export const setVoiceEnabled = (enabled) => {
  enhancedVoiceEngine.setEnabled(enabled);
};

export const speakFeedback = async (text, options = {}) => {
  return await enhancedVoiceEngine.speak(text, options);
};

/**
 * Speak a fatigue warning
 */
export const announceFatigue = (level) => {
  if (level === 'high') {
    speakFeedback('Warning. High fatigue detected. Consider resting.', 'high');
  } else if (level === 'medium') {
    speakFeedback('Moderate fatigue. Focus on form.', 'medium');
  }
};

/**
 * Stop any current speech
 */
export const stopSpeech = () => {
  Speech.stop();
};
