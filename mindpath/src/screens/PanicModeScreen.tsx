import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, Dimensions, ScrollView, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Spacing, Radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'PanicMode'>;

const { width } = Dimensions.get('window');

const STEPS = [
  {
    icon: 'heart-outline' as const,
    title: 'You are safe right now',
    body: 'This feeling is temporary. Your body is trying to protect you. You are not in danger.',
    action: 'I hear you',
  },
  {
    icon: 'radio-button-on-outline' as const,
    title: 'Breathe with me',
    body: 'Breathe in slowly through your nose for 4 counts... hold for 2... and out through your mouth for 6 counts.',
    action: 'I breathed',
    breathing: true,
  },
  {
    icon: 'eye-outline' as const,
    title: 'Look around the room',
    body: 'Name 5 things you can see right now. Look for colours, shapes, objects. Take your time.',
    action: 'I did it',
  },
  {
    icon: 'hand-left-outline' as const,
    title: 'Feel the ground beneath you',
    body: 'Press your feet flat on the floor. Feel the weight of your body. Notice the surface under your hands.',
    action: 'I can feel it',
  },
  {
    icon: 'sunny-outline' as const,
    title: 'This will pass',
    body: 'Panic peaks within 10 minutes and always passes. You have gotten through this before. You are stronger than you know.',
    action: 'I feel better',
  },
];

export default function PanicModeScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const orbScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle breathing orb animation always running
    const breathe = () => {
      Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.2, duration: 4000, useNativeDriver: false }),
        Animated.timing(orbScale, { toValue: 1, duration: 6000, useNativeDriver: false }),
      ]).start(({ finished }) => { if (finished) breathe(); });
    };
    breathe();
    Vibration.vibrate([0, 200, 100, 200]);
  }, []);

  const advance = () => {
    if (step >= STEPS.length - 1) {
      navigation.goBack();
      return;
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(s => s + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  };

  const current = STEPS[step];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0d1f2d', '#1a3a47', '#0d2233']} style={styles.gradient}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>

          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>Panic Support</Text>
            <Text style={styles.stepLabel}>{step + 1} / {STEPS.length}</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
          </View>

          {/* Breathing orb */}
          <View style={styles.orbContainer}>
            <Animated.View style={[styles.orbOuter, { transform: [{ scale: orbScale }] }]} />
            <View style={styles.orbInner}>
              <Ionicons name={current.icon} size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.body}>{current.body}</Text>
          </Animated.View>

          {/* Action button */}
          <TouchableOpacity style={styles.actionBtn} onPress={advance} activeOpacity={0.85}>
            <Text style={styles.actionText}>
              {step >= STEPS.length - 1 ? 'I feel better now' : current.action}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          {/* SOS link */}
          <TouchableOpacity onPress={() => navigation.navigate('SOSResources')} style={styles.sosLink}>
            <Text style={styles.sosText}>Need more help? Tap for crisis resources →</Text>
          </TouchableOpacity>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  stepLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600', width: 36, textAlign: 'right' },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 32 },
  progressFill: { height: 3, backgroundColor: '#4A8B9F', borderRadius: 2 },
  orbContainer: { alignItems: 'center', justifyContent: 'center', height: width * 0.5, marginBottom: 32 },
  orbOuter: { position: 'absolute', width: width * 0.5, height: width * 0.5, borderRadius: width * 0.25, backgroundColor: 'rgba(74,139,159,0.25)' },
  orbInner: { width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15, backgroundColor: 'rgba(74,139,159,0.4)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 16, lineHeight: 32 },
  body: { fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 26 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4A8B9F', borderRadius: Radius.full,
    paddingVertical: 18, marginBottom: 16,
  },
  actionText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  sosLink: { alignItems: 'center', paddingBottom: 8 },
  sosText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecorationLine: 'underline' },
});
