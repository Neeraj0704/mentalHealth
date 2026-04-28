import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Vibration, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Breathing'>;

const { width } = Dimensions.get('window');
const ORB_SIZE = width * 0.55;

const PATTERNS = {
  box:   { label: 'Box Breathing',    phases: ['Inhale', 'Hold', 'Exhale', 'Hold'],   durations: [4, 4, 4, 4] },
  '4-6': { label: 'Calm Breathing',   phases: ['Inhale', 'Exhale'],                   durations: [4, 6] },
  panic: { label: 'Panic Recovery',   phases: ['Inhale', 'Exhale'],                   durations: [3, 7] },
};

export default function BreathingScreen({ navigation, route }: Props) {
  const patternKey = route.params?.pattern ?? 'box';
  const pattern = PATTERNS[patternKey];

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(pattern.durations[0]);
  const [cycles, setCycles] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof PATTERNS>(patternKey);

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(0);
  const countRef = useRef(pattern.durations[0]);

  const currentPattern = PATTERNS[selectedPattern];

  const stopBreathing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0.6, duration: 500, useNativeDriver: false }),
    ]).start();
    setRunning(false);
    setPhaseIdx(0);
    setCountdown(currentPattern.durations[0]);
    phaseRef.current = 0;
    countRef.current = currentPattern.durations[0];
  }, [currentPattern, scale, opacity]);

  const animatePhase = useCallback((idx: number) => {
    const isInhale = currentPattern.phases[idx] === 'Inhale';
    const isHold = currentPattern.phases[idx] === 'Hold';
    const dur = currentPattern.durations[idx] * 1000;

    Vibration.vibrate(100);

    if (isHold) {
      // no scale change during hold
      return;
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: isInhale ? 1.35 : 1,
        duration: dur,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: isInhale ? 1 : 0.5,
        duration: dur,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentPattern, scale, opacity]);

  const startBreathing = useCallback(() => {
    phaseRef.current = 0;
    countRef.current = currentPattern.durations[0];
    setPhaseIdx(0);
    setCountdown(currentPattern.durations[0]);
    setCycles(0);
    setRunning(true);
    animatePhase(0);

    intervalRef.current = setInterval(() => {
      countRef.current -= 1;
      setCountdown(countRef.current);

      if (countRef.current <= 0) {
        const nextPhase = (phaseRef.current + 1) % currentPattern.phases.length;
        if (nextPhase === 0) setCycles(c => c + 1);
        phaseRef.current = nextPhase;
        countRef.current = currentPattern.durations[nextPhase];
        setPhaseIdx(nextPhase);
        setCountdown(countRef.current);
        animatePhase(nextPhase);
      }
    }, 1000);
  }, [currentPattern, animatePhase]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (running) { stopBreathing(); }
  }, [selectedPattern]);

  const currentPhase = currentPattern.phases[phaseIdx];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => { stopBreathing(); navigation.goBack(); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <Text style={styles.title}>Breathing</Text>
          {running && <Text style={styles.cycles}>{cycles} cycles</Text>}
          {!running && <View style={{ width: 60 }} />}
        </View>

        {/* Pattern selector */}
        <View style={styles.patternRow}>
          {(Object.keys(PATTERNS) as Array<keyof typeof PATTERNS>).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.patternChip, selectedPattern === k && styles.patternChipActive]}
              onPress={() => setSelectedPattern(k)}
              activeOpacity={0.8}
            >
              <Text style={[styles.patternChipText, selectedPattern === k && styles.patternChipTextActive]}>
                {PATTERNS[k].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Breathing orb */}
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.orbOuter, { transform: [{ scale }], opacity }]} />
        <Animated.View style={[styles.orbInner, { transform: [{ scale: Animated.multiply(scale, 0.75) }] }]}>
          <Text style={styles.phaseText}>{running ? currentPhase : 'Tap to begin'}</Text>
          {running && <Text style={styles.countText}>{countdown}</Text>}
        </Animated.View>
      </View>

      {/* Controls */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {!running ? (
          <TouchableOpacity style={styles.startBtn} onPress={startBreathing} activeOpacity={0.85}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startBtnText}>Begin</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopBtn} onPress={stopBreathing} activeOpacity={0.85}>
            <Ionicons name="stop" size={20} color="#fff" />
            <Text style={styles.startBtnText}>Stop</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.hint}>Phone will vibrate on each phase change</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2233' },
  safe: {},
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cycles: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600', width: 60, textAlign: 'right' },
  patternRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, paddingBottom: 8, flexWrap: 'wrap' },
  patternChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  patternChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  patternChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  patternChipTextActive: { color: '#fff' },
  orbContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbOuter: {
    position: 'absolute',
    width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2,
    backgroundColor: Colors.primary,
  },
  orbInner: {
    width: ORB_SIZE * 0.75, height: ORB_SIZE * 0.75, borderRadius: ORB_SIZE / 2,
    backgroundColor: '#1a4a5e',
    alignItems: 'center', justifyContent: 'center',
  },
  phaseText: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center' },
  countText: { fontSize: 48, fontWeight: '800', color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  bottom: { paddingHorizontal: Spacing.md, paddingBottom: 16, alignItems: 'center', gap: 12 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 48 },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#555', borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 48 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
