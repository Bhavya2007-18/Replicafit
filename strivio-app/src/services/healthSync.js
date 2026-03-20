import { Platform } from 'react-native';
import HealthKit, { HKQuantityTypeIdentifier } from '@kingstinct/react-native-healthkit';
import {
  initialize,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';

// Maps SparkyFitness logic to Strivio Core
export const initHealthSync = async () => {
  try {
    if (Platform.OS === 'ios') {
      const isAvailable = await HealthKit.isHealthDataAvailable();
      if (!isAvailable) return false;
      
      await HealthKit.requestAuthorization([
        HKQuantityTypeIdentifier.stepCount,
        HKQuantityTypeIdentifier.activeEnergyBurned,
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.distanceWalkingRunning
      ]);
      console.log('✅ Apple HealthKit Initialized');
      return true;
    } else if (Platform.OS === 'android') {
      // Connect to Google Health Connect
      const isInitialized = await initialize();
      if (!isInitialized) return false;

      // Request read permissions for basic fitness metrics
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'SleepSession' }
      ]);
      console.log('✅ Google Health Connect Initialized');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Health Sync Initialization Failed:', error.message);
    return false;
  }
};

export const fetchDailyMetrics = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  
  let metrics = { steps: 0, calories: 0, distance: 0 };

  try {
    if (Platform.OS === 'ios') {
      const steps = await HealthKit.queryStatisticTotal(HKQuantityTypeIdentifier.stepCount, {
        from: startOfDay, to: endOfDay
      });
      const cals = await HealthKit.queryStatisticTotal(HKQuantityTypeIdentifier.activeEnergyBurned, {
        from: startOfDay, to: endOfDay
      });
      metrics.steps = steps || 0;
      metrics.calories = cals || 0;
    } else if (Platform.OS === 'android') {
      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: endOfDay.toISOString(),
        },
      });
      metrics.steps = result.records.reduce((acc, current) => acc + current.count, 0);
    }
    return metrics;
  } catch (error) {
    console.warn('⚠️ Could not fetch health metrics', error.message);
    return metrics;
  }
};
