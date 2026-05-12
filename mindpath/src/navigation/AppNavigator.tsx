import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSaved } from '../context/SavedContext';

import {
  RootStackParamList,
  HomeStackParamList,
  SavedStackParamList,
  ProfileStackParamList,
  MainTabParamList,
} from '../types';

import { Colors, Shadows } from '../theme';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import OnboardingPreferencesScreen from '../screens/OnboardingPreferencesScreen';
import AssessmentScreen from '../screens/AssessmentScreen';
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import FilterScreen from '../screens/FilterScreen';
import ProviderDetailScreen from '../screens/ProviderDetailScreen';
import VoiceAssessmentScreen from '../screens/VoiceAssessmentScreen';
import MiraChatScreen from '../screens/MiraChatScreen';
import AssessmentResultScreen from '../screens/AssessmentResultScreen';
import BookingScreen from '../screens/BookingScreen';
import FacilityDetailScreen from '../screens/FacilityDetailScreen';
import FacilitiesListScreen from '../screens/FacilitiesListScreen';
import ClinicFilterModal from '../screens/ClinicFilterModal';
import ConsentScreen from '../screens/ConsentScreen';
import WellnessScreen from '../screens/WellnessScreen';
import BreathingScreen from '../screens/BreathingScreen';
import PanicModeScreen from '../screens/PanicModeScreen';
import GroundingScreen from '../screens/GroundingScreen';
import SOSScreen from '../screens/SOSScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ScreeningStack = createNativeStackNavigator<HomeStackParamList>();
const SavedStack = createNativeStackNavigator<SavedStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Assessment" component={AssessmentScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
      <HomeStack.Screen name="MiraChat" component={MiraChatScreen} />
      <HomeStack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
      <HomeStack.Screen name="VoiceAssessment" component={VoiceAssessmentScreen} />
      <HomeStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <HomeStack.Screen name="Booking" component={BookingScreen} />
      <HomeStack.Screen name="FacilityDetail" component={FacilityDetailScreen} />
      <HomeStack.Screen name="FacilitiesList" component={FacilitiesListScreen} />
      <HomeStack.Screen name="Wellness" component={WellnessScreen} />
      <HomeStack.Screen name="Breathing" component={BreathingScreen} />
      <HomeStack.Screen name="PanicMode" component={PanicModeScreen} />
      <HomeStack.Screen name="Grounding" component={GroundingScreen} />
      <HomeStack.Screen name="SOSResources" component={SOSScreen} />
    </HomeStack.Navigator>
  );
}

function ScreeningNavigator() {
  return (
    <ScreeningStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Assessment">
      <ScreeningStack.Screen name="Assessment" component={AssessmentScreen} />
      <ScreeningStack.Screen name="Results" component={ResultsScreen} />
      <ScreeningStack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
      <ScreeningStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <ScreeningStack.Screen name="FacilityDetail" component={FacilityDetailScreen} />
      <ScreeningStack.Screen name="Booking" component={BookingScreen} />
      <ScreeningStack.Screen name="VoiceAssessment" component={VoiceAssessmentScreen} />
      <ScreeningStack.Screen name="Home" component={HomeScreen} />
    </ScreeningStack.Navigator>
  );
}

function SavedNavigator() {
  return (
    <SavedStack.Navigator screenOptions={{ headerShown: false }}>
      <SavedStack.Screen name="Saved" component={SavedScreen} />
      <SavedStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <SavedStack.Screen name="Booking" component={BookingScreen} />
      <SavedStack.Screen name="FacilityDetail" component={FacilityDetailScreen} />
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

function AIOrbButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.orbWrapper} activeOpacity={0.85}>
      <View style={styles.orbShadow}>
        <LinearGradient
          colors={['#2E6A7E', '#4A8B9F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbGradient}
        >
          <View style={styles.orbInner}>
            <View style={styles.orbPulse1} />
            <View style={styles.orbPulse2} />
            <Ionicons name="aperture-outline" size={24} color="#fff" />
          </View>
        </LinearGradient>
      </View>
      <Text style={styles.orbLabel}>Mira</Text>
    </TouchableOpacity>
  );
}


function MiraIntroPopup({ onDismiss }: { onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal transparent animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[styles.popupBubble, { opacity }]}>
          <View style={styles.popupIconRow}>
            <View style={styles.popupOrbDot}>
              <Ionicons name="aperture-outline" size={16} color="#fff" />
            </View>
            <Text style={styles.popupOrbName}>Mira</Text>
          </View>
          <Text style={styles.popupText}>
            Speak to our AI assistant Mira to help us understand what's been affecting you lately
          </Text>
          <Text style={styles.popupHint}>Tap anywhere to dismiss</Text>
          <View style={styles.popupArrow} />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function MainTabs() {
  const { savedIds, savedFacilityIds } = useSaved();
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarIcon: ({ focused, color }) => {
            if (route.name === 'AITab') return null;
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'ScreeningTab') {
              iconName = focused ? 'clipboard' : 'clipboard-outline';
            } else if (route.name === 'HomeTab') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'SavedTab') {
              iconName = focused ? 'bookmark' : 'bookmark-outline';
            } else if (route.name === 'ProfileTab') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return (
              <View style={styles.tabIconWrapper}>
                <Ionicons name={iconName} size={22} color={color} />
                {route.name === 'SavedTab' && <TabBadge count={savedIds.size + savedFacilityIds.size} />}
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="ScreeningTab"
          component={ScreeningNavigator}
          options={{ tabBarLabel: 'Screening' }}
          listeners={({ navigation }) => ({
            tabPress: () => navigation.navigate('ScreeningTab', { screen: 'Assessment' }),
          })}
        />
        <Tab.Screen
          name="HomeTab"
          component={HomeNavigator}
          options={{ tabBarLabel: 'Discover' }}
          listeners={({ navigation }) => ({
            tabPress: () => navigation.navigate('HomeTab', { screen: 'Home' }),
          })}
        />
        <Tab.Screen
          name="AITab"
          component={HomeNavigator}
          options={({ navigation }) => ({
            tabBarLabel: '',
            tabBarButton: () => (
              <AIOrbButton onPress={() => navigation.navigate('HomeTab', { screen: 'MiraChat' } as any)} />
            ),
          })}
        />
        <Tab.Screen name="SavedTab" component={SavedNavigator} options={{ tabBarLabel: 'Saved' }} />
        <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ tabBarLabel: 'Profile' }} />
      </Tab.Navigator>
      {showIntro && <MiraIntroPopup onDismiss={() => setShowIntro(false)} />}
    </>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Consent"
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Consent" component={ConsentScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="PreferencesSetup" component={OnboardingPreferencesScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="FilterModal"
          component={FilterScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen
          name="ClinicFilterModal"
          component={ClinicFilterModal}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
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
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    flex: 1,
  },
  orbShadow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E6A7E',
    shadowColor: '#2E6A7E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  orbGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbPulse1: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  orbPulse2: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orbLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  popupOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 110,
  },
  popupBubble: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '22',
  },
  popupIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  popupOrbDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  popupOrbName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  popupText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  popupHint: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  popupArrow: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: Colors.surface,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.primary + '22',
  },
});

export default AppNavigator;
