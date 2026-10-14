import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { COLORS } from '../constants/colors';
import { useAuth } from '../store/authStore';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import MealsScreen from '../screens/MealsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// The two navigators we switch between.
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Top-level navigation. Shows auth screens if not logged in,
// otherwise shows the bottom tab bar.
export default function AppNavigator() {
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabs /> : <AuthFlow />}
    </NavigationContainer>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTitleStyle: { color: COLORS.text },
        headerTintColor: COLORS.text,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopWidth: 0 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="💪" /> }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="🍎" /> }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="📊" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tab.Navigator>
  );
}

// Tiny emoji "icon" so we don't need to ship image assets.
function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}
