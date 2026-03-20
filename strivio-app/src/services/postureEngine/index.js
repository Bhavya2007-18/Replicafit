/**
 * Strivio Posture Engine
 * Analyzes biomechanics for real-time form correction.
 * Outputs structured feedback for UI integration.
 */

// Define ideal form rules and error mapping
const POSTURE_RULES = {
  squats: {
    knee: {
      check: (angles) => angles.kneeAngle > 110 && angles.kneeAngle < 150, // Only check depth when they are bending
      issue: 'too shallow',
      correction: 'Lower your hips deeper',
      getSeverity: (angles) => Math.min((angles.kneeAngle - 110) / 40, 1),
    },
    back: {
      check: (angles) => angles.backAngle > 30,
      issue: 'rounded',
      correction: 'Straighten your back',
      getSeverity: (angles) => Math.min((angles.backAngle - 30) / 30, 1),
    },
    alignment: {
      check: (angles) => Math.abs(angles.kneeAlignment || 0) > 15,
      issue: 'valgus',
      correction: 'Keep knees aligned with toes',
      getSeverity: (angles) => Math.min((Math.abs(angles.kneeAlignment) - 15) / 20, 1),
    },
    spine: {
      check: (angles) => {
        // Spine angle = shoulder-hip-knee; ideal > 160° (near straight)
        const spineAngle = angles.hipAngle || 180;
        return spineAngle < 140;
      },
      issue: 'excessive forward lean',
      correction: 'Keep your chest up and core tight',
      getSeverity: (angles) => Math.min((140 - (angles.hipAngle || 180)) / 40, 1),
    }
  },
  pushups: {
    elbow: {
      check: (angles) => angles.elbowAngle > 100 && angles.elbowAngle < 150,
      issue: 'too shallow',
      correction: 'Lower your chest more',
      getSeverity: (angles) => Math.min((angles.elbowAngle - 100) / 50, 1),
    },
    hip: {
      check: (angles) => angles.hipAngle < 160,
      issue: 'sagging',
      correction: 'Keep your body in a straight line',
      getSeverity: (angles) => Math.min((160 - angles.hipAngle) / 40, 1),
    },
    symmetry: {
      check: (angles) => Math.abs(angles.symmetry || 0) > 15,
      issue: 'imbalanced',
      correction: 'Keep shoulders level',
      getSeverity: (angles) => Math.min((Math.abs(angles.symmetry) - 15) / 20, 1),
    }
  },
  lunges: {
    frontKnee: {
      check: (angles) => angles.frontKnee > 110 && angles.frontKnee < 150,
      issue: 'too shallow',
      correction: 'Bend front knee deeper',
      getSeverity: (angles) => Math.min((angles.frontKnee - 110) / 40, 1),
    },
    torso: {
      check: (angles) => angles.torsoUpright > 20,
      issue: 'leaning',
      correction: 'Keep your torso upright',
      getSeverity: (angles) => Math.min((angles.torsoUpright - 20) / 30, 1),
    },
    spine: {
      check: (angles) => {
        const backAngle = angles.backAngle || 0;
        return backAngle > 25;
      },
      issue: 'excessive forward lean',
      correction: 'Keep your spine neutral and core braced',
      getSeverity: (angles) => Math.min((angles.backAngle - 25) / 30, 1),
    }
  },
  planks: {
    hip: {
      check: (angles) => angles.hipAngle < 165 || angles.hipAngle > 185,
      issue: 'misaligned',
      correction: 'Keep body in a straight line',
      getSeverity: (angles) => Math.min(Math.abs(175 - angles.hipAngle) / 30, 1),
    }
  }
};

/**
 * Detects biomechanical form errors based on real-time joint angles.
 * @param {string} exercise - Current exercise identifier (e.g., 'squats')
 * @param {object} angles - Extracted angles from pose detection
 * @returns {Array} List of structured error objects { joint, issue, severity, correction }
 */
export const detectPostureErrors = (exercise, angles) => {
  if (!exercise || !angles || !POSTURE_RULES[exercise]) return [];

  const exerciseRules = POSTURE_RULES[exercise];
  const errors = [];

  for (const [joint, rule] of Object.entries(exerciseRules)) {
    if (rule.check(angles)) {
      errors.push({
        joint,
        issue: rule.issue,
        severity: Number(rule.getSeverity(angles).toFixed(2)),
        correction: rule.correction
      });
    }
  }

  // Sort by severity so the most critical error is first
  return errors.sort((a, b) => b.severity - a.severity);
};
