import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import WorkoutPlansScreen from './src/screens/WorkoutPlansScreen';
import ExerciseLibraryScreen from './src/screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import GuidedWorkoutScreen from './src/screens/GuidedWorkoutScreen';
import DietGuidelinesScreen from './src/screens/DietGuidelinesScreen';
import ProgressDashboardScreen from './src/screens/ProgressDashboardScreen';
import GoalTrackingScreen from './src/screens/GoalTrackingScreen';
import AICoachChatScreen from './src/screens/AICoachChatScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="HomeDashboard"
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#d4af35',
          headerTitleStyle: { fontWeight: 'bold', color: '#ffffff' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutPlans" component={WorkoutPlansScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GuidedWorkout" component={GuidedWorkoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DietGuidelines" component={DietGuidelinesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GoalTracking" component={GoalTrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AICoachChat" component={AICoachChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
registerRootComponent(App);
