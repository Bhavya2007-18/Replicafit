/**
 * Strivio Advanced Injury Detection System
 * AI-powered movement analysis for injury risk assessment
 * Real-time monitoring and preventive recommendations
 */

class AdvancedInjuryDetectionEngine {
  constructor() {
    this.riskFactors = {
      form: {
        poorPosture: 0.3,
        improperAlignment: 0.4,
        jerkyMovements: 0.2,
        overextension: 0.5
      },
      fatigue: {
        high: 0.6,
        moderate: 0.3,
        low: 0.1
      },
      overuse: {
        high: 0.4,
        moderate: 0.2,
        low: 0.05
      },
      biomechanics: {
        asymmetry: 0.3,
        compensation: 0.4,
        instability: 0.5
      }
    };

    this.injuryPatterns = this.initializeInjuryPatterns();
    this.movementHistory = new Map();
    this.riskHistory = new Map();
    this.alerts = new Map();
  }

  /**
   * Initialize injury patterns database
   */
  initializeInjuryPatterns() {
    return {
      knee: {
        riskFactors: ['deep_squat_depth', 'knee_valgus', 'rapid_direction_change', 'high_impact'],
        symptoms: ['knee_pain', 'swelling', 'instability', 'popping_sensations'],
        prevention: ['strengthen_quads', 'improve_hip_stability', 'proper_warmup', 'technique_correction'],
        exercises: ['wall_sits', 'clamshells', 'glute_bridges', 'quad_sets']
      },
      shoulder: {
        riskFactors: ['overhead_reaching', 'improper_rotator_cuff', 'excessive_load', 'poor_scapular_control'],
        symptoms: ['shoulder_pain', 'weakness', 'limited_range', 'clicking'],
        prevention: ['rotator_cuff_strengthening', 'scapular_stability', 'mobility_work', 'load_management'],
        exercises: ['band_pull_aparts', 'scapular_retractions', 'external_rotations', 'wall_slides']
      },
      lower_back: {
        riskFactors: ['poor_posture', 'improper_lifting', 'core_weakness', 'excessive_flexion'],
        symptoms: ['back_pain', 'stiffness', 'muscle_spasms', 'radiating_pain'],
        prevention: ['core_strengthening', 'posture_correction', 'proper_lifting', 'flexibility'],
        exercises: ['planks', 'bird_dog', 'cat_cow', 'pelvic_tilts']
      },
      ankle: {
        riskFactors: ['improper_landing', 'weak_ankle_stability', 'inappropriate_footwear', 'surface_issues'],
        symptoms: ['ankle_pain', 'instability', 'swelling', 'difficulty_bearing_weight'],
        prevention: ['ankle_strengthening', 'proprioception_training', 'proper_footwear', 'surface_awareness'],
        exercises: ['calf_raises', 'balance_exercises', 'ankle_circles', 'towel_scrunches']
      },
      wrist: {
        riskFactors: ['improper_wrist_position', 'excessive_load', 'repetitive_motion', 'poor_grip'],
        symptoms: ['wrist_pain', 'weakness', 'numbness', 'limited_motion'],
        prevention: ['wrist_strengthening', 'proper_technique', 'load_distribution', 'rest_periods'],
        exercises: ['wrist_curls', 'grip_strengthening', 'wrist_rotations', 'finger_spreads']
      }
    };
  }

  /**
   * Analyze movement for injury risk
   */
  analyzeMovementRisk(userId, movementData) {
    const userProfile = this.getUserMovementHistory(userId);
    const currentRisk = this.calculateCurrentRisk(movementData);
    const historicalRisk = this.getHistoricalRisk(userId);
    
    // Combine current and historical risk
    const combinedRisk = this.combineRiskFactors(currentRisk, historicalRisk, userProfile);
    
    // Identify specific injury risks
    const injuryRisks = this.identifyInjuryRisks(movementData, combinedRisk);
    
    // Generate recommendations
    const recommendations = this.generatePreventionRecommendations(injuryRisks, movementData);
    
    // Check for immediate alerts
    const alerts = this.checkForAlerts(combinedRisk, injuryRisks);
    
    // Update history
    this.updateMovementHistory(userId, movementData, combinedRisk);
    
    return {
      overallRisk: combinedRisk.overall,
      riskFactors: combinedRisk.factors,
      injuryRisks,
      recommendations,
      alerts,
      movementQuality: this.assessMovementQuality(movementData),
      biomechanics: this.analyzeBiomechanics(movementData)
    };
  }

  /**
   * Calculate current movement risk
   */
  calculateCurrentRisk(movementData) {
    const riskFactors = {};
    let totalRisk = 0;

    // Form analysis
    const formRisk = this.analyzeFormRisk(movementData);
    riskFactors.form = formRisk;
    totalRisk += formRisk;

    // Fatigue assessment
    const fatigueRisk = this.assessFatigueRisk(movementData);
    riskFactors.fatigue = fatigueRisk;
    totalRisk += fatigueRisk;

    // Overuse detection
    const overuseRisk = this.detectOveruseRisk(movementData);
    riskFactors.overuse = overuseRisk;
    totalRisk += overuseRisk;

    // Biomechanical analysis
    const biomechanicsRisk = this.analyzeBiomechanicsRisk(movementData);
    riskFactors.biomechanics = biomechanicsRisk;
    totalRisk += biomechanicsRisk;

    // Normalize overall risk (0-1)
    const overallRisk = Math.min(totalRisk / 4, 1);

    return {
      overall,
      factors: riskFactors,
      confidence: this.calculateRiskConfidence(movementData)
    };
  }

  /**
   * Analyze form-related risks
   */
  analyzeFormRisk(movementData) {
    let riskScore = 0;
    const issues = [];

    // Check for poor posture
    if (movementData.posture?.quality < 0.7) {
      riskScore += this.riskFactors.form.poorPosture;
      issues.push('poor_posture');
    }

    // Check for improper alignment
    if (movementData.alignment?.deviation > 0.3) {
      riskScore += this.riskFactors.form.improperAlignment;
      issues.push('improper_alignment');
    }

    // Check for jerky movements
    if (movementData.smoothness?.score < 0.6) {
      riskScore += this.riskFactors.form.jerkyMovements;
      issues.push('jerky_movements');
    }

    // Check for overextension
    if (movementData.range?.overextension) {
      riskScore += this.riskFactors.form.overextension;
      issues.push('overextension');
    }

    return {
      score: Math.min(riskScore, 1),
      issues,
      severity: this.categorizeRiskSeverity(riskScore)
    };
  }

  /**
   * Assess fatigue-related risks
   */
  assessFatigueRisk(movementData) {
    const fatigueLevel = movementData.fatigue?.level || 'low';
    const riskScore = this.riskFactors.fatigue[fatigueLevel] || 0.1;

    // Additional factors that increase fatigue risk
    let additionalRisk = 0;

    if (movementData.duration > 45) {
      additionalRisk += 0.1; // Long duration increases risk
    }

    if (movementData.intensity === 'high') {
      additionalRisk += 0.15; // High intensity with fatigue
    }

    if (movementData.reps > 15) {
      additionalRisk += 0.1; // High rep count with fatigue
    }

    return {
      score: Math.min(riskScore + additionalRisk, 1),
      level: fatigueLevel,
      factors: ['duration', 'intensity', 'rep_count'].filter(factor => 
        movementData[factor] && movementData[factor] > this.getThreshold(factor)
      ),
      severity: this.categorizeRiskSeverity(riskScore + additionalRisk)
    };
  }

  /**
   * Detect overuse risks
   */
  detectOveruseRisk(movementData) {
    let riskScore = 0;
    const overuseFactors = [];

    // Check for repeated stress on same joints
    if (movementData.jointStress?.repetitive) {
      riskScore += 0.3;
      overuseFactors.push('repetitive_stress');
    }

    // Check for insufficient recovery
    if (movementData.recovery?.insufficient) {
      riskScore += 0.2;
      overuseFactors.push('insufficient_recovery');
    }

    // Check for high volume
    if (movementData.volume?.excessive) {
      riskScore += 0.25;
      overuseFactors.push('excessive_volume');
    }

    // Check for rapid progression
    if (movementData.progression?.too_fast) {
      riskScore += 0.15;
      overuseFactors.push('rapid_progression');
    }

    return {
      score: Math.min(riskScore, 1),
      factors: overuseFactors,
      severity: this.categorizeRiskSeverity(riskScore)
    };
  }

  /**
   * Analyze biomechanical risks
   */
  analyzeBiomechanicsRisk(movementData) {
    let riskScore = 0;
    const biomechanicalIssues = [];

    // Check for asymmetry
    if (movementData.symmetry?.score < 0.8) {
      riskScore += this.riskFactors.biomechanics.asymmetry;
      biomechanicalIssues.push('asymmetry');
    }

    // Check for compensation patterns
    if (movementData.compensation?.detected) {
      riskScore += this.riskFactors.biomechanics.compensation;
      biomechanicalIssues.push('compensation');
    }

    // Check for instability
    if (movementData.stability?.score < 0.7) {
      riskScore += this.riskFactors.biomechanics.instability;
      biomechanicalIssues.push('instability');
    }

    return {
      score: Math.min(riskScore, 1),
      issues: biomechanicalIssues,
      severity: this.categorizeRiskSeverity(riskScore)
    };
  }

  /**
   * Identify specific injury risks
   */
  identifyInjuryRisks(movementData, combinedRisk) {
    const injuryRisks = {};

    Object.entries(this.injuryPatterns).forEach(([bodyPart, pattern]) => {
      let riskScore = 0;
      const detectedFactors = [];

      // Check each risk factor for this body part
      pattern.riskFactors.forEach(factor => {
        if (this.hasRiskFactor(movementData, factor)) {
          riskScore += 0.25; // Each factor contributes 25% risk
          detectedFactors.push(factor);
        }
      });

      // Adjust based on overall risk
      riskScore *= combinedRisk.overall;

      if (riskScore > 0.3) { // Only include significant risks
        injuryRisks[bodyPart] = {
          risk: Math.min(riskScore, 1),
          factors: detectedFactors,
          severity: this.categorizeRiskSeverity(riskScore),
          prevention: pattern.prevention,
          exercises: pattern.exercises,
          symptoms: pattern.symptoms
        };
      }
    });

    return injuryRisks;
  }

  /**
   * Check if movement data contains specific risk factor
   */
  hasRiskFactor(movementData, factor) {
    const factorMappings = {
      'deep_squat_depth': () => movementData.exercise === 'squat' && movementData.depth?.ratio > 0.9,
      'knee_valgus': () => movementData.knees?.valgus > 0.15,
      'rapid_direction_change': () => movementData.direction?.changes > 3,
      'high_impact': () => movementData.impact?.force > 0.8,
      'overhead_reaching': () => movementData.shoulders?.overhead > 0.8,
      'improper_rotator_cuff': () => movementData.shoulders?.rotation < 0.6,
      'excessive_load': () => movementData.load?.relative > 0.9,
      'poor_scapular_control': () => movementData.scapula?.control < 0.7,
      'poor_posture': () => movementData.posture?.quality < 0.6,
      'improper_lifting': () => movementData.technique?.lifting < 0.7,
      'core_weakness': () => movementData.core?.engagement < 0.5,
      'excessive_flexion': () => movementData.spine?.flexion > 0.8,
      'improper_landing': () => movementData.landing?.technique < 0.6,
      'weak_ankle_stability': () => movementData.ankle?.stability < 0.6,
      'inappropriate_footwear': () => movementData.footwear?.support < 0.5,
      'surface_issues': () => movementData.surface?.stability < 0.7,
      'improper_wrist_position': () => movementData.wrist?.alignment < 0.7,
      'excessive_load': () => movementData.load?.wrist > 0.8,
      'repetitive_motion': () => movementData.repetition?.count > 20,
      'poor_grip': () => movementData.grip?.quality < 0.6
    };

    const checkFunction = factorMappings[factor];
    return checkFunction ? checkFunction() : false;
  }

  /**
   * Generate prevention recommendations
   */
  generatePreventionRecommendations(injuryRisks, movementData) {
    const recommendations = {
      immediate: [],
      short_term: [],
      long_term: [],
      technique: [],
      equipment: []
    };

    Object.entries(injuryRisks).forEach(([bodyPart, risk]) => {
      const pattern = this.injuryPatterns[bodyPart];

      // Immediate recommendations
      if (risk.severity === 'high') {
        recommendations.immediate.push({
          priority: 'high',
          message: `High ${bodyPart} injury risk detected. Consider stopping or reducing intensity.`,
          action: 'stop_or_reduce'
        });
      }

      // Short-term recommendations
      pattern.prevention.slice(0, 2).forEach(prevention => {
        recommendations.short_term.push({
          priority: 'medium',
          message: this.formatPreventionMessage(prevention, bodyPart),
          action: prevention
        });
      });

      // Long-term recommendations
      pattern.exercises.forEach(exercise => {
        recommendations.long_term.push({
          priority: 'low',
          message: `Include ${exercise.replace('_', ' ')} in your routine for ${bodyPart} health.`,
          exercise
        });
      });

      // Technique corrections
      if (movementData.technique?.issues) {
        movementData.technique.issues.forEach(issue => {
          recommendations.technique.push({
            priority: 'medium',
            message: `Focus on ${issue.replace('_', ' ')} to reduce injury risk.`,
            correction: issue
          });
        });
      }

      // Equipment recommendations
      if (movementData.equipment?.concerns) {
        recommendations.equipment.push({
          priority: 'low',
          message: 'Consider proper footwear and equipment for better support.',
          equipment: 'proper_support'
        });
      }
    });

    return recommendations;
  }

  /**
   * Check for immediate alerts
   */
  checkForAlerts(combinedRisk, injuryRisks) {
    const alerts = [];

    // High overall risk alert
    if (combinedRisk.overall > 0.8) {
      alerts.push({
        type: 'critical',
        message: 'Critical injury risk detected! Stop exercising and consult a professional.',
        urgency: 'immediate',
        action: 'stop_exercise'
      });
    }

    // High-risk body part alerts
    Object.entries(injuryRisks).forEach(([bodyPart, risk]) => {
      if (risk.severity === 'high') {
        alerts.push({
          type: 'warning',
          message: `High ${bodyPart} injury risk. Modify technique or reduce intensity.`,
          urgency: 'high',
          bodyPart,
          action: 'modify_technique'
        });
      }
    });

    // Form breakdown alerts
    if (combinedRisk.factors.form?.severity === 'high') {
      alerts.push({
        type: 'form_alert',
        message: 'Form breakdown detected. Focus on technique before continuing.',
        urgency: 'medium',
        action: 'improve_form'
      });
    }

    // Fatigue alerts
    if (combinedRisk.factors.fatigue?.level === 'high') {
      alerts.push({
        type: 'fatigue_alert',
        message: 'High fatigue detected. Consider taking a break or reducing intensity.',
        urgency: 'medium',
        action: 'rest_or_reduce'
      });
    }

    return alerts;
  }

  /**
   * Assess overall movement quality
   */
  assessMovementQuality(movementData) {
    let qualityScore = 0;
    const factors = [];

    // Form quality (40% weight)
    const formScore = movementData.form?.score || 0.7;
    qualityScore += formScore * 0.4;
    factors.push({ name: 'form', score: formScore, weight: 0.4 });

    // Smoothness (25% weight)
    const smoothnessScore = movementData.smoothness?.score || 0.8;
    qualityScore += smoothnessScore * 0.25;
    factors.push({ name: 'smoothness', score: smoothnessScore, weight: 0.25 });

    // Consistency (20% weight)
    const consistencyScore = movementData.consistency?.score || 0.75;
    qualityScore += consistencyScore * 0.2;
    factors.push({ name: 'consistency', score: consistencyScore, weight: 0.2 });

    // Control (15% weight)
    const controlScore = movementData.control?.score || 0.7;
    qualityScore += controlScore * 0.15;
    factors.push({ name: 'control', score: controlScore, weight: 0.15 });

    const overallQuality = Math.min(qualityScore, 1);

    return {
      overall: overallQuality,
      grade: this.getQualityGrade(overallQuality),
      factors,
      improvements: this.getImprovementSuggestions(factors)
    };
  }

  /**
   * Analyze biomechanics in detail
   */
  analyzeBiomechanics(movementData) {
    return {
      symmetry: {
        score: movementData.symmetry?.score || 0.8,
        leftRight: movementData.symmetry?.leftRight || {},
        issues: movementData.symmetry?.issues || []
      },
      stability: {
        score: movementData.stability?.score || 0.75,
        base: movementData.stability?.base || 'stable',
        issues: movementData.stability?.issues || []
      },
      range: {
        flexibility: movementData.range?.flexibility || 0.8,
        overextension: movementData.range?.overextension || false,
        optimal: movementData.range?.optimal || true
      },
      force: {
        distribution: movementData.force?.distribution || {},
        impact: movementData.force?.impact || 'moderate',
        efficiency: movementData.force?.efficiency || 0.75
      },
      timing: {
        rhythm: movementData.timing?.rhythm || 0.8,
        tempo: movementData.timing?.tempo || 'moderate',
        consistency: movementData.timing?.consistency || 0.75
      }
    };
  }

  /**
   * Get user's movement history
   */
  getUserMovementHistory(userId) {
    return this.movementHistory.get(userId) || {
      sessions: [],
      avgRisk: 0,
      trends: {},
      lastAnalysis: null
    };
  }

  /**
   * Get historical risk data
   */
  getHistoricalRisk(userId) {
    return this.riskHistory.get(userId) || {
      baseline: 0.3,
      trend: 'stable',
      incidents: [],
      adaptations: []
    };
  }

  /**
   * Combine current and historical risk factors
   */
  combineRiskFactors(currentRisk, historicalRisk, userProfile) {
    const combined = {
      overall: currentRisk.overall,
      factors: { ...currentRisk.factors },
      adjustments: {}
    };

    // Adjust based on historical trends
    if (historicalRisk.trend === 'increasing') {
      combined.overall += 0.1;
      combined.adjustments.historical_trend = '+10% (increasing trend)';
    } else if (historicalRisk.trend === 'decreasing') {
      combined.overall -= 0.05;
      combined.adjustments.historical_trend = '-5% (decreasing trend)';
    }

    // Adjust based on previous incidents
    if (historicalRisk.incidents.length > 0) {
      const recentIncidents = historicalRisk.incidents.filter(incident => 
        Date.now() - new Date(incident.date).getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
      );
      
      if (recentIncidents.length > 0) {
        combined.overall += 0.15;
        combined.adjustments.recent_incidents = '+15% (recent incidents)';
      }
    }

    // Adjust based on user profile
    if (userProfile.age > 40) {
      combined.overall += 0.05;
      combined.adjustments.age = '+5% (age factor)';
    }

    if (userProfile.experienceLevel === 'beginner') {
      combined.overall += 0.1;
      combined.adjustments.experience = '+10% (beginner)';
    }

    return {
      ...combined,
      overall: Math.min(combined.overall, 1)
    };
  }

  /**
   * Update movement history
   */
  updateMovementHistory(userId, movementData, riskData) {
    const history = this.getUserMovementHistory(userId);
    
    // Add new session
    history.sessions.push({
      timestamp: new Date().toISOString(),
      exercise: movementData.exercise,
      risk: riskData.overall,
      quality: this.assessMovementQuality(movementData).overall,
      issues: Object.keys(riskData.injuryRisks)
    });

    // Keep only last 50 sessions
    if (history.sessions.length > 50) {
      history.sessions = history.sessions.slice(-50);
    }

    // Update averages
    history.avgRisk = history.sessions.reduce((sum, session) => sum + session.risk, 0) / history.sessions.length;
    history.lastAnalysis = new Date().toISOString();

    this.movementHistory.set(userId, history);
  }

  /**
   * Helper methods
   */
  categorizeRiskSeverity(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  calculateRiskConfidence(movementData) {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more data points
    if (movementData.angles) confidence += 0.1;
    if (movementData.velocity) confidence += 0.1;
    if (movementData.force) confidence += 0.1;
    if (movementData.duration) confidence += 0.1;
    if (movementData.reps) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  getThreshold(factor) {
    const thresholds = {
      duration: 30,
      intensity: 'moderate',
      rep_count: 12
    };
    return thresholds[factor];
  }

  formatPreventionMessage(prevention, bodyPart) {
    const messages = {
      'strengthen_quads': `Strengthen quadriceps to reduce ${bodyPart} stress`,
      'improve_hip_stability': `Improve hip stability for better ${bodyPart} alignment`,
      'proper_warmup': `Always warm up properly to protect your ${bodyPart}`,
      'technique_correction': `Focus on correct technique to prevent ${bodyPart} injury`
    };
    return messages[prevention] || `${prevention.replace('_', ' ')} for ${bodyPart} health`;
  }

  getQualityGrade(score) {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  getImprovementSuggestions(factors) {
    const suggestions = [];
    
    factors.forEach(factor => {
      if (factor.score < 0.7) {
        switch (factor.name) {
          case 'form':
            suggestions.push('Focus on proper form and technique');
            break;
          case 'smoothness':
            suggestions.push('Practice smoother, more controlled movements');
            break;
          case 'consistency':
            suggestions.push('Work on maintaining consistent movement patterns');
            break;
          case 'control':
            suggestions.push('Improve muscle control and stability');
            break;
        }
      }
    });

    return suggestions;
  }

  /**
   * Get injury prevention plan
   */
  getInjuryPreventionPlan(userId) {
    const history = this.getUserMovementHistory(userId);
    const recentRisks = history.sessions.slice(-10);
    
    const commonIssues = this.identifyCommonIssues(recentRisks);
    const preventionPlan = this.createPreventionPlan(commonIssues);
    
    return {
      commonIssues,
      preventionPlan,
      recommendedFrequency: this.getRecommendedFrequency(commonIssues),
      focusAreas: this.getFocusAreas(commonIssues)
    };
  }

  identifyCommonIssues(recentSessions) {
    const issueFrequency = {};
    
    recentSessions.forEach(session => {
      session.issues.forEach(issue => {
        issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
      });
    });

    return Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([issue, frequency]) => ({ issue, frequency }));
  }

  createPreventionPlan(commonIssues) {
    const plan = {
      exercises: [],
      techniques: [],
      equipment: [],
      frequency: 'weekly'
    };

    commonIssues.forEach(({ issue }) => {
      const pattern = this.injuryPatterns[issue];
      if (pattern) {
        plan.exercises.push(...pattern.exercises.slice(0, 2));
        plan.techniques.push(...pattern.prevention.slice(0, 2));
      }
    });

    // Remove duplicates
    plan.exercises = [...new Set(plan.exercises)];
    plan.techniques = [...new Set(plan.techniques)];

    return plan;
  }

  getRecommendedFrequency(commonIssues) {
    if (commonIssues.length === 0) return 'monthly';
    if (commonIssues.length === 1) return 'bi-weekly';
    return 'weekly';
  }

  getFocusAreas(commonIssues) {
    return commonIssues.map(({ issue }) => ({
      bodyPart: issue,
      priority: issue === 'knee' || issue === 'lower_back' ? 'high' : 'medium'
    }));
  }
}

// Export singleton instance
export const advancedInjuryDetectionEngine = new AdvancedInjuryDetectionEngine();

// Export utility functions
export const assessMovementPattern = (movementData) => {
  const patterns = {
    squat: {
      keyPoints: ['knee_alignment', 'hip_depth', 'back_position'],
      commonIssues: ['knee_valgus', 'forward_lean', 'insufficient_depth']
    },
    deadlift: {
      keyPoints: ['spine_position', 'hip_hinge', 'grip_strength'],
      commonIssues: ['rounded_back', 'improper_hinge', 'grip_issues']
    },
    overhead_press: {
      keyPoints: ['shoulder_position', 'core_stability', 'elbow_lockout'],
      commonIssues: ['shoulder_impingement', 'core_instability', 'incomplete_lockout']
    }
  };

  const exercise = movementData.exercise?.toLowerCase();
  return patterns[exercise] || patterns.squat; // Default to squat pattern
};

export const getInjuryRiskColor = (riskLevel) => {
  const colors = {
    low: '#4CAF50',      // Green
    medium: '#FF9800',    // Orange
    high: '#F44336',      // Red
    critical: '#9C27B0'   // Purple
  };
  
  return colors[riskLevel] || colors.low;
};
