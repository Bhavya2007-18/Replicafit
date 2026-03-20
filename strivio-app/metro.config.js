const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('bin');
config.resolver.assetExts.push('db');

// Shim modules that don't exist in React Native
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@tensorflow/tfjs-backend-webgpu': path.resolve(__dirname, 'shims/tfjs-backend-webgpu.js'),
};

module.exports = config;
