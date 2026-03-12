/**
 * Skeleton Overlay Component
 * Draws body skeleton connections over the camera feed.
 * Color-coded: green (good), yellow (minor issue), red (bad form).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { SKELETON_CONNECTIONS, findKeypoint } from '../services/poseDetectionService';

const MIN_SCORE = 0.3;

const getAccuracyColor = (accuracy) => {
  if (accuracy >= 75) return '#00ff88'; // green
  if (accuracy >= 50) return '#ffd93d'; // yellow
  return '#ff4757'; // red
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
              strokeWidth={3}
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
              r={5}
              fill={color}
              opacity={0.9}
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
