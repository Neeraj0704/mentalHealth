import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { HomeStackParamList } from '../types';

const AMBIENT_SOUND = require('../../assets/sounds/leberch-calming-yoga-248030.mp3');

type Props = NativeStackScreenProps<HomeStackParamList, 'SafeSpace'>;

const { width, height } = Dimensions.get('window');

const AFFIRMATIONS = [
  'You are safe here',
  'This will pass',
  'You are enough',
  'Breathe slowly',
  'You are not alone',
  'This moment is yours',
];

// Simple deterministic star positions
const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: ((i * 137.5) % 100),
  y: ((i * 97.3) % 100),
  size: (i % 3) + 1,
  opacity: 0.1 + (i % 4) * 0.08,
}));

export default function SafeSpaceScreen({ navigation }: Props) {
  const orbScale  = useRef(new Animated.Value(1)).current;
  const orbOpac   = useRef(new Animated.Value(0.25)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opac  = useRef(new Animated.Value(0.15)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opac  = useRef(new Animated.Value(0.08)).current;
  const textOpac  = useRef(new Animated.Value(0)).current;
  const gradientOpac = useRef(new Animated.Value(0)).current;

  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const affirmOpac = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Load and play ambient sound
    const loadSound = async () => {
      try {
        console.log('[SafeSpace] Setting audio mode...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        console.log('[SafeSpace] Loading local sound...');
        const { sound } = await Audio.Sound.createAsync(
          AMBIENT_SOUND,
          { shouldPlay: true, isLooping: true, volume: 0.7 }
        );
        soundRef.current = sound;
        const status = await sound.getStatusAsync();
        console.log('[SafeSpace] Sound status:', JSON.stringify(status));
      } catch (e) {
        console.warn('[SafeSpace] Ambient sound failed to load:', e);
      }
    };
    loadSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    // Fade in whole screen
    Animated.timing(gradientOpac, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
    Animated.timing(textOpac, { toValue: 1, duration: 2500, useNativeDriver: true }).start();

    // Core orb breathing (4s in, 6s out)
    const breathe = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbScale, { toValue: 1.2,  duration: 4000, useNativeDriver: false }),
          Animated.timing(orbOpac,  { toValue: 0.5,  duration: 4000, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(orbScale, { toValue: 1,    duration: 6000, useNativeDriver: false }),
          Animated.timing(orbOpac,  { toValue: 0.25, duration: 6000, useNativeDriver: false }),
        ]),
      ]).start(({ finished }) => { if (finished) breathe(); });
    };
    breathe();

    // Ring 1 — slightly slower
    const breatheRing1 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale, { toValue: 1.35, duration: 5000, useNativeDriver: false }),
          Animated.timing(ring1Opac,  { toValue: 0.25, duration: 5000, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale, { toValue: 1,    duration: 7000, useNativeDriver: false }),
          Animated.timing(ring1Opac,  { toValue: 0.08, duration: 7000, useNativeDriver: false }),
        ]),
      ]).start(({ finished }) => { if (finished) breatheRing1(); });
    };
    breatheRing1();

    // Ring 2 — slowest
    const breatheRing2 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring2Scale, { toValue: 1.55, duration: 7000, useNativeDriver: false }),
          Animated.timing(ring2Opac,  { toValue: 0.12, duration: 7000, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(ring2Scale, { toValue: 1,    duration: 9000, useNativeDriver: false }),
          Animated.timing(ring2Opac,  { toValue: 0.04, duration: 9000, useNativeDriver: false }),
        ]),
      ]).start(({ finished }) => { if (finished) breatheRing2(); });
    };
    breatheRing2();

    // Rotating affirmations
    let idx = 0;
    const cycleAffirmations = () => {
      Animated.sequence([
        Animated.timing(affirmOpac, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.delay(3500),
        Animated.timing(affirmOpac, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          idx = (idx + 1) % AFFIRMATIONS.length;
          setAffirmationIdx(idx);
          cycleAffirmations();
        }
      });
    };
    const timer = setTimeout(cycleAffirmations, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#060d18', '#0a1628', '#0d1f2d']} style={styles.gradient}>

        {/* Stars */}
        {STARS.map((star, i) => (
          <View
            key={i}
            style={[styles.star, {
              left: `${star.x}%` as any,
              top: `${star.y}%` as any,
              width: star.size,
              height: star.size,
              borderRadius: star.size,
              opacity: star.opacity,
            }]}
          />
        ))}

        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity onPress={async () => { await soundRef.current?.unloadAsync(); navigation.goBack(); }} style={styles.exitBtn}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Orb with concentric rings */}
        <View style={styles.orbContainer}>
          {/* Outer ring */}
          <Animated.View style={[styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opac }]} />
          {/* Middle ring */}
          <Animated.View style={[styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opac }]} />
          {/* Core orb */}
          <Animated.View style={[styles.orbGlow, { transform: [{ scale: orbScale }], opacity: orbOpac }]} />
          <View style={styles.orbCore} />
        </View>

        {/* Rotating affirmation */}
        <Animated.View style={[styles.affirmContainer, { opacity: affirmOpac }]}>
          <Text style={styles.affirmText}>{AFFIRMATIONS[affirmationIdx]}</Text>
        </Animated.View>

        <SafeAreaView edges={['bottom']} style={styles.bottom} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  star: { position: 'absolute', backgroundColor: '#fff' },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  exitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  orbContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring2: {
    position: 'absolute',
    width: width * 0.88, height: width * 0.88, borderRadius: width * 0.44,
    backgroundColor: '#2E6A7E',
  },
  ring1: {
    position: 'absolute',
    width: width * 0.72, height: width * 0.72, borderRadius: width * 0.36,
    backgroundColor: '#3A7A8F',
  },
  orbGlow: {
    position: 'absolute',
    width: width * 0.55, height: width * 0.55, borderRadius: width * 0.275,
    backgroundColor: '#4A8B9F',
  },
  orbCore: {
    width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15,
    backgroundColor: '#1a3d50',
  },
  affirmContainer: { alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  affirmText: {
    fontSize: 24, fontWeight: '300', color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5, textAlign: 'center', lineHeight: 34,
  },
  bottom: { paddingBottom: 20 },
});
