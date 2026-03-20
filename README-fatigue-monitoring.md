# Fatigue Monitoring Feature

## 🎯 Feature Overview

The Fatigue Monitoring feature fuses smart band signals (HR/HRV) with camera-based pose estimation to deliver real-time fatigue analysis and doctor-style recovery recommendations.

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FATIGUE MONITORING PIPELINE             │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   SENSORS    │    │    CORE      │    │     FEEDBACK     │
│              │    │    ENGINE    │    │                  │
├──────────────┤    ├──────────────┤    ├──────────────────┤
│ • Smart Band │───▶│ • ML Model   │───▶│ • Fatigue Score  │
│   (HR/HRV)   │    │ • Scoring    │    │ • Doctor Advice  │
│              │    │ • Analysis   │    │ • Recovery Plan  │
│ • Camera     │    │              │    │                  │
│   (ROM/Speed)│    │              │    │                  │
└──────────────┘    └──────────────┘    └──────────────────┘

Data Flow: Sensors → Signal Collection → ML Processing → User Feedback
```

## 🔬 Fatigue Score Calculation

The fatigue score (0-100) is computed from four weighted factors:

| Factor | Weight | Indicator |
|--------|--------|-----------|
| HRV Drop | 40% | Autonomic nervous system fatigue |
| Rep Speed | 20% | Muscular power degradation |
| ROM Reduction | 20% | Joint/muscle fatigue |
| HR Elevation | 20% | Cardiovascular stress |

### Score Interpretation

| Score | Status | Recommendation |
|-------|--------|----------------|
| 0-20 | 🟢 Fresh | Continue current intensity |
| 21-40 | 🟡 Low Fatigue | Minor adjustments needed |
| 41-60 | 🟠 Moderate | Switch exercises or reduce weight |
| 61-80 | 🔴 High | Rest 2-3 minutes required |
| 81-100 | ⚠️ Critical | Stop and recover 3-5 minutes |

## 📂 Components

### Backend
- **FatigueSession.js** - MongoDB schema for storing fatigue sessions
  - Tracks HR, HRV, rep speed, ROM, fatigue score
  - Timestamps for trend analysis
  - User and exercise association

### Core Engine
- **fatigueModel.js** - ML fatigue scoring algorithm
  - `computeFatigueScore()` - Calculates 0-100 fatigue score
  - `generateFeedback()` - Creates doctor-style recommendations
  - `analyzeExerciseQuality()` - Breakdown of power, mobility, stress
  - `getRecoveryRecommendation()` - Rest and next-set guidance

### Frontend
- **FatigueMonitorScreen.js** - Real-time fatigue display
  - Animated fatigue score visualization
  - Signal breakdown (HR, HRV, rep speed, ROM)
  - Exercise quality metrics
  - Auto-refresh monitoring mode
  - Manual refresh capability

- **signalCollector.js** - Sensor integration service
  - Smart band HR/HRV collection
  - Camera pose data processing
  - Rep speed calculation
  - ROM measurement

## 🚀 Usage

### Basic Implementation
```javascript
import { collectSignals } from '../services/signalCollector';
import { computeFatigueScore, generateFeedback } from '../../../strivio_core_engine/fatigueModel';

// Collect signals
const signals = await collectSignals();

// Compute score
const score = computeFatigueScore(signals);

// Get feedback
const advice = generateFeedback(score, 'Squats');
// Returns: "✅ You're fresh and ready during Squats!..."
```

### Navigation to Monitor
```javascript
navigation.navigate('FatigueMonitor', {
  exerciseId: 'squats',
  exerciseName: 'Squats'
});
```

## 📱 User Experience

1. **During Exercise**: User performs exercise with camera tracking
2. **Signal Collection**: App fetches HR/HRV from smart band + pose data from camera
3. **Real-time Analysis**: ML model computes fatigue score every 30 seconds
4. **Visual Feedback**: Color-coded score (Green → Red) with pulse animation
5. **Doctor's Assessment**: Personalized advice based on fatigue level
6. **Recovery Protocol**: Specific rest time and weight adjustment recommendations
7. **Quality Metrics**: Power, mobility, cardio stress, recovery status breakdown

## 🔧 Configuration

### Baseline Values
Default baselines for new users (stored in user profile):
```javascript
const DEFAULT_BASELINE_HR = 70;   // Resting heart rate
const DEFAULT_BASELINE_HRV = 50;  // HRV (RMSSD) at rest
```

### Monitoring Intervals
- Initial analysis: On screen load
- Auto-refresh: Every 30 seconds (when monitoring enabled)
- Manual refresh: User-triggered

## 📊 Data Storage

Fatigue sessions are stored in MongoDB with schema:
```javascript
{
  userId: String,
  hr: Number,
  hrv: Number,
  repSpeed: Number,
  rom: Number,
  fatigueScore: Number,
  feedback: String,
  exerciseId: String,
  exerciseName: String,
  timestamp: Date
}
```

## 🎨 UI Components

- **Score Circle**: Animated, color-coded fatigue indicator
- **Feedback Card**: Doctor-style assessment with exercise context
- **Recovery Card**: Yellow-highlighted rest recommendations
- **Signals Card**: Raw biometric data display
- **Quality Card**: Exercise quality breakdown with colored badges
- **Control Buttons**: Start/Stop monitoring, manual refresh

## 🔮 Future Enhancements

- [ ] Integration with specific smart bands (Whoop, Garmin, Apple Watch)
- [ ] Historical trend analysis and fatigue prediction
- [ ] Personalized baseline learning from user data
- [ ] Voice announcements for critical fatigue levels
- [ ] Integration with workout plan auto-adjustment
- [ ] Export fatigue data for coach/doctor review

## 🩺 Medical Disclaimer

This feature provides general fitness guidance based on biometric signals. It is not a substitute for professional medical advice. Users should consult healthcare providers for personalized recommendations, especially those with cardiovascular conditions.
