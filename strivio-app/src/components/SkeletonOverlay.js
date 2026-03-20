import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { SKELETON_CONNECTIONS, findKeypoint } from '../services/poseDetectionService';
import { COLORS } from '../theme/colors';

const MIN_SCORE = 0.35; // Matches poseDetectionService stricter threshold

const getAccuracyColor = (accuracy) => {
  if (accuracy >= 80) return COLORS.primaryContainer; // Neon Lime
  if (accuracy >= 50) return COLORS.secondary;        // Yellow-ish
  return COLORS.error;                                // Red-ish
};

export default function SkeletonOverlay({ keypoints, accuracy, width, height }) {
  if (!keypoints || keypoints.length === 0) return null;

  const color = getAccuracyColor(accuracy);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Draw skeleton connections */}
        {SKELETON_CONNECTIONS.map(([startName, endName], index) => {
          const start = findKeypoint(keypoints, startName);
          const end = findKeypoint(keypoints, endName);

          if (!start || !end || start.score < MIN_SCORE || end.score < MIN_SCORE) return null;

          return (
            <Line
              key={index}
              x1={start.x * width}
              y1={start.y * height}
              x2={end.x * width}
              y2={end.y * height}
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.8}
            />
          );
        })}

        {/* Draw keypoint dots */}
        {keypoints.map((kp, index) => {
          if (!kp || kp.score < MIN_SCORE) return null;
          return (
            <Circle
              key={index}
              cx={kp.x * width}
              cy={kp.y * height}
              r={6}
              fill={color}
              stroke={COLORS.background}
              strokeWidth={2}
              opacity={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});
