import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Spacing, Radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Grounding'>;

const STEPS = [
  { count: 5, sense: 'SEE',   icon: 'eye-outline' as const,        color: '#4A8B9F', prompt: 'Look around and name 5 things you can see right now.' },
  { count: 4, sense: 'TOUCH', icon: 'hand-left-outline' as const,  color: '#6BAF92', prompt: 'Touch 4 objects near you. Notice their texture and temperature.' },
  { count: 3, sense: 'HEAR',  icon: 'ear-outline' as const,        color: '#8B6BAF', prompt: 'Listen carefully. Name 3 sounds you can hear right now.' },
  { count: 2, sense: 'SMELL', icon: 'leaf-outline' as const,       color: '#E8956A', prompt: 'Name 2 things you can smell. If nothing, imagine a calming scent.' },
  { count: 1, sense: 'TASTE', icon: 'restaurant-outline' as const, color: '#C0392B', prompt: 'Notice 1 thing you can taste. Take a slow sip of water if nearby.' },
];

export default function GroundingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const current = STEPS[step];

  const advance = () => {
    if (step >= STEPS.length - 1) {
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  };

  if (done) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0d2233', '#1a3a47']} style={styles.gradient}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.doneSafe}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark-circle" size={72} color="#6BAF92" />
            </View>
            <Text style={styles.doneTitle}>Well done</Text>
            <Text style={styles.doneBody}>
              You just completed the 5-4-3-2-1 grounding exercise.{'\n\n'}
              Your nervous system is starting to settle. Take a few more slow breaths and notice how you feel.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Return to tools</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0d2233', '#1a3a47']} style={styles.gradient}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>

          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>5-4-3-2-1 Grounding</Text>
            <Text style={styles.stepLabel}>{step + 1}/5</Text>
          </View>

          {/* Step indicators */}
          <View style={styles.stepsRow}>
            {STEPS.map((s, i) => (
              <View key={i} style={[styles.stepDot, i <= step && { backgroundColor: s.color }, i === step && styles.stepDotActive]} />
            ))}
          </View>

          {/* Main content */}
          <View style={styles.centerContent}>
            <View style={[styles.senseCircle, { backgroundColor: current.color + '33', borderColor: current.color }]}>
              <Text style={[styles.senseCount, { color: current.color }]}>{current.count}</Text>
              <Ionicons name={current.icon} size={28} color={current.color} />
              <Text style={[styles.senseLabel, { color: current.color }]}>{current.sense}</Text>
            </View>

            <Text style={styles.prompt}>{current.prompt}</Text>

            <Text style={styles.takeTime}>Take your time. There's no rush.</Text>
          </View>

          <TouchableOpacity
            style={[styles.doneStepBtn, { backgroundColor: current.color }]}
            onPress={advance}
            activeOpacity={0.85}
          >
            <Text style={styles.doneStepText}>
              {step >= STEPS.length - 1 ? 'I\'m done' : `Done. Next: ${STEPS[step + 1].count} things to ${STEPS[step + 1].sense.toLowerCase()}`}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  stepLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  stepsRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepDotActive: { height: 6 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  senseCircle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  senseCount: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  senseLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  prompt: { fontSize: 18, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 28, paddingHorizontal: 8 },
  takeTime: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  doneStepBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: Radius.full, paddingVertical: 18, marginBottom: 8,
  },
  doneStepText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  doneSafe: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md * 1.5 },
  doneIcon: { marginBottom: 24 },
  doneTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 16 },
  doneBody: { fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  doneBtn: { backgroundColor: '#6BAF92', borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 40 },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
