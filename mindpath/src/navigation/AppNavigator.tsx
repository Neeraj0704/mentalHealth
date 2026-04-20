import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSaved } from '../context/SavedContext';
import { hasSetPreferences } from '../services/preferences';

import {
  RootStackParamList,
  HomeStackParamList,
  SavedStackParamList,
  ProfileStackParamList,
  MainTabParamList,
} from '../types';

import { Colors, Shadows, Radius } from '../theme';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import OnboardingPreferencesScreen from '../screens/OnboardingPreferencesScreen';
import AssessmentScreen from '../screens/AssessmentScreen';
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import FilterScreen from '../screens/FilterScreen';
import ProviderDetailScreen from '../screens/ProviderDetailScreen';
import VoiceAssessmentScreen from '../screens/VoiceAssessmentScreen';
import BookingScreen from '../screens/BookingScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SavedStack = createNativeStackNavigator<SavedStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Assessment" component={AssessmentScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
      <HomeStack.Screen name="VoiceAssessment" component={VoiceAssessmentScreen} />
      <HomeStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <HomeStack.Screen name="Booking" component={BookingScreen} />
    </HomeStack.Navigator>
  );
}

function SavedNavigator() {
  return (
    <SavedStack.Navigator screenOptions={{ headerShown: false }}>
      <SavedStack.Screen name="Saved" component={SavedScreen} />
      <SavedStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <SavedStack.Screen name="Booking" component={BookingScreen} />
    </SavedStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.tabBadge}>
      <Text style={styles.tabBadgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function MainTabs() {
  const { savedIds } = useSaved();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'SavedTab') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return (
            <View style={styles.tabIconWrapper}>
              <Ionicons name={iconName} size={22} color={color} />
              {route.name === 'SavedTab' && (
                <TabBadge count={savedIds.size} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedNavigator}
        options={{ tabBarLabel: 'Saved' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    // Check if user has already set preferences
    // For demo: always show onboarding → preferences on first launch
    hasSetPreferences().then(set => {
      setInitialRoute(set ? 'MainTabs' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="PreferencesSetup" component={OnboardingPreferencesScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="FilterModal"
          component={FilterScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    ...Shadows.md,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
});

export default AppNavigator;
