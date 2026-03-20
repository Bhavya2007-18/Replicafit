Replicafit – AI Powered Fitness Form Coach 🏋️‍♂️

Replicafit is an AI-powered fitness assistant that helps users perform exercises correctly, follow structured workout plans, and maintain a healthier lifestyle. By combining computer vision, intelligent planning, and activity tracking, Strivio acts as a virtual personal trainer that guides users through every step of their fitness journey.

Unlike traditional fitness apps that only track steps or calories, Strivio focuses on exercise accuracy and proper form, ensuring workouts are both safe and effective.

The Problem

Many people exercise without proper guidance, especially when training alone. Incorrect posture or poor technique during workouts can lead to:

• Reduced workout effectiveness
• Muscle imbalance
• Increased risk of injury
• Lack of consistent training plans

Most fitness apps track activity but do not analyze how exercises are actually performed.

The Solution

Strivio uses AI-powered pose detection to analyze body movement through the device camera. It evaluates posture, tracks repetitions, and provides real-time feedback to help users perform exercises with correct technique.

Along with form analysis, Strivio generates personalized workout plans, provides diet guidelines, and integrates with activity tracking platforms to monitor overall health and fitness.

Key Features
AI Exercise Accuracy Detection

Strivio uses computer vision models to detect body joints and track movement patterns during exercises.

The system compares user posture with correct exercise techniques and generates an accuracy score along with corrective feedback.

Example:

Squat Accuracy: 87%

✔ Good knee alignment
✔ Balanced stance
✖ Lower hips slightly deeper
✖ Keep back straighter

This allows users to continuously improve their form and reduce the chance of injury.

Personalized Workout Plans

Replicafit generates structured workout routines based on user goals and lifestyle.

User inputs include:

• Fitness goal (fat loss, muscle gain, endurance)
• Age, height, and weight
• Activity level
• Available workout equipment

Based on this information, the system creates a weekly training program tailored to the user.

Example:

Day 1
• Squats – 3 × 12
• Pushups – 3 × 10
• Plank – 3 × 30 seconds

Day 2
• Lunges – 3 × 12
• Pullups – 3 × 6
• Leg Raises – 3 × 12

Diet Guidelines

Strivio provides general nutrition recommendations to support fitness goals.

These include:

• Daily protein requirements
• Estimated calorie intake
• Hydration recommendations

The app also suggests common healthy foods such as eggs, milk, oats, lentils, vegetables, and lean proteins.

Activity Tracking Integration

Replicafit integrates with Google Fit to monitor daily physical activity.

The integration allows the app to track:

• Steps walked
• Calories burned
• Active minutes
• Distance traveled

This helps users understand their overall activity levels beyond workouts.

Guided Workout Mode

Replicafit provides real-time guidance during workouts.

Features include:

• Exercise demonstration with YouTube tutorial videos
• Rep counting and form analysis
• Posture analysis using the camera
• Timer and rest intervals
• Instant form correction feedback
• Fatigue monitoring and recovery recommendations

Example session:

Exercise: Squats
Target Reps: 12

Rep 1 – Correct
Rep 2 – Correct  
Rep 3 – Back bending detected
Rep 4 – Fatigue score: 65% (Moderate)
Recommendation: Rest 2 minutes or switch to lighter weight

Exercise Knowledge Library

The platform includes a comprehensive exercise library with detailed instructions.

Each exercise includes:

• Target muscle groups
• Step-by-step execution guide
• Common mistakes to avoid (with visual examples)
• Difficulty level
• YouTube tutorial videos
• Video preview images

Progress Tracking

Replicafit helps users monitor long-term progress through:

• Workout streaks
• Exercise accuracy improvement
• Weight change tracking
• Calories burned
• Fatigue level monitoring
• Recovery recommendations

These insights help maintain motivation and consistency.

Technology Stack

Frontend
React Native / Expo

Backend
Node.js / Express / MongoDB

AI Pose Detection
MediaPipe
TensorFlow Lite
MoveNet

Fatigue Monitoring
Heart Rate Variability (HRV) Analysis
Smart Band Integration
Real-time Signal Processing

Activity Tracking
Google Fit API

Database
MongoDB / Mongoose

System Architecture

Mobile Application (React Native)
│
├ Camera Input (MediaPipe)
│
├ Pose Detection Engine (TensorFlow Lite)
│
├ Exercise Analysis System
│
├ Fatigue Monitoring System
│   ├ Heart Rate/HRV Collection
│   ├ Range of Motion Analysis
│   └ Fatigue Scoring Algorithm
│
├ Workout Recommendation Engine
│
├ Activity Tracking Integration
│
└ Cloud Database (MongoDB)

Future Improvements

Future versions of Strivio may include:

• Real-time voice coaching during exercises
• Injury risk detection using movement patterns
• Adaptive workouts that evolve with user progress
• Gamification with rewards and achievements
• Integration with wearable fitness devices
• Advanced fatigue prediction algorithms
• Multi-exercise workout sessions
• Social features and community challenges

Getting Started

Prerequisites
• Node.js 16+ and npm
• React Native development environment
• MongoDB database
• Expo CLI

Installation

1. Clone the repository
```bash
git clone https://github.com/Bhavya2007-18/Replicafit.git
cd Replicafit
```

2. Install backend dependencies
```bash
cd strivio-backend
npm install
```

3. Install frontend dependencies
```bash
cd ../strivio-app
npm install
```

4. Start the backend server
```bash
cd ../strivio-backend
npm start
```

5. Start the mobile app
```bash
cd ../strivio-app
npx expo start
```

Key Features Implemented

✅ Exercise Tutorial Links
- YouTube video integration
- WebView modal for tutorials
- Video preview images

✅ Fatigue Monitoring System
- Heart Rate and HRV analysis
- Range of motion tracking
- Real-time fatigue scoring
- Doctor-style feedback

✅ AI Form Analysis
- Real-time pose detection
- Exercise accuracy scoring
- Instant feedback and corrections

Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

License

This project is licensed under the MIT License - see the LICENSE file for details.

Vision

Strivio aims to make professional fitness coaching accessible to everyone by using artificial intelligence to guide users toward safer, smarter, and more effective workouts.
