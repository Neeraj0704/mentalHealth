import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'search-outline' as const,
    title: 'Find the right fit',
    description: 'Browse vetted mental health providers matched to your needs.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Insurance verified',
    description: 'Filter by your insurance plan, language, and specialty.',
  },
  {
    icon: 'videocam-outline' as const,
    title: 'Telehealth ready',
    description: 'Find providers who offer virtual visits on your schedule.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.stagger(
        120,
        featureAnims.map((anim) =>
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true })
        )
      ),
    ]).start();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2E6A7E', '#4A8B9F', '#6BAF92']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe}>
          {/* Logo + branding */}
          <Animated.View
            style={[
              styles.hero,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Ionicons name="leaf" size={34} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.appName}>MindPath</Text>
            <Text style={styles.tagline}>
              Find the mental health provider{'\n'}who's right for you
            </Text>
          </Animated.View>

          {/* Feature list */}
          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <Animated.View
                key={f.title}
                style={[
                  styles.featureItem,
                  {
                    opacity: featureAnims[i],
                    transform: [
                      {
                        translateX: featureAnims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={22} color={Colors.textInverse} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDescription}>{f.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* CTA */}
          <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.replace('PreferencesSetup')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Free to use · No account required
            </Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.06,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  features: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
    marginBottom: 3,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 19,
  },
  ctaSection: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: 17,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  disclaimer: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
});
