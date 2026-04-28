import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Wellness'>;

const MOODS = [
  { icon: 'alert-circle-outline' as const, color: '#f59e0b', label: 'Anxious',     tool: 'Breathing' as const, pattern: 'box' as const },
  { icon: 'water-outline' as const,        color: '#60a5fa', label: 'Sad',         tool: 'SafeSpace' as const },
  { icon: 'flame-outline' as const,        color: '#f87171', label: 'Angry',       tool: 'Breathing' as const, pattern: '4-6' as const },
  { icon: 'thunderstorm-outline' as const, color: '#c084fc', label: 'Overwhelmed', tool: 'Grounding' as const },
  { icon: 'moon-outline' as const,         color: '#94a3b8', label: 'Exhausted',   tool: 'SafeSpace' as const },
  { icon: 'remove-circle-outline' as const,color: '#6ee7b7', label: 'Numb',        tool: 'Grounding' as const },
];

const TOOLS = [
  { icon: 'radio-button-on-outline' as const, label: 'Breathing', sub: 'Calm your nervous system', screen: 'Breathing' as const, color: '#2E6A7E', bg: '#EEF6F9' },
  { icon: 'hand-left-outline' as const,       label: 'Grounding', sub: '5-4-3-2-1 technique',      screen: 'Grounding' as const, color: '#6BAF92', bg: '#EEF7F2' },
  { icon: 'moon-outline' as const,            label: 'Safe Space', sub: 'Calming environment',      screen: 'SafeSpace' as const, color: '#8B6BAF', bg: '#F7EEF9' },
  { icon: 'alert-circle-outline' as const,    label: 'SOS',        sub: 'Crisis resources',          screen: 'SOSResources' as const, color: '#E05C5C', bg: '#FEF0F0' },
];

export default function WellnessScreen({ navigation }: Props) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleMoodSelect = (idx: number) => {
    setSelectedMood(idx);
    const mood = MOODS[idx];
    setTimeout(() => {
      if (mood.tool === 'Breathing') navigation.navigate('Breathing', { pattern: mood.pattern });
      else if (mood.tool === 'SafeSpace') navigation.navigate('SafeSpace');
      else if (mood.tool === 'Grounding') navigation.navigate('Grounding');
    }, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a47', '#2E6A7E']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Support Tools</Text>
            <Text style={styles.headerSub}>How are you feeling right now?</Text>
          </View>
        </SafeAreaView>

        {/* Mood selector */}
        <View style={styles.moodRow}>
          {MOODS.map((mood, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.moodBtn, selectedMood === i && styles.moodBtnSelected]}
              onPress={() => handleMoodSelect(i)}
              activeOpacity={0.8}
            >
              <Ionicons name={mood.icon} size={28} color={mood.color} />
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Panic button — prominent */}
        <TouchableOpacity style={styles.panicBtn} onPress={() => navigation.navigate('PanicMode')} activeOpacity={0.85}>
          <View style={styles.panicIcon}>
            <Ionicons name="heart-outline" size={22} color="#fff" />
          </View>
          <View style={styles.panicText}>
            <Text style={styles.panicTitle}>I'm panicking right now</Text>
            <Text style={styles.panicSub}>Immediate guided support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Tools</Text>

        {/* Tool grid */}
        <View style={styles.toolGrid}>
          {TOOLS.map((tool, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.toolCard, { backgroundColor: tool.bg }]}
              onPress={() => navigation.navigate(tool.screen as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.toolIcon, { backgroundColor: tool.color + '22' }]}>
                <Ionicons name={tool.icon} size={24} color={tool.color} />
              </View>
              <Text style={[styles.toolLabel, { color: tool.color }]}>{tool.label}</Text>
              <Text style={styles.toolSub}>{tool.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerNote}>
          These tools are not a substitute for professional care.{'\n'}
          If you are in crisis, tap SOS above or call 988.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 24 },
  headerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: 8, marginTop: 16 },
  moodBtn: {
    width: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  moodBtnSelected: { backgroundColor: 'rgba(255,255,255,0.3)' },
  moodLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  content: { padding: Spacing.md, paddingBottom: 60, gap: 16 },
  panicBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#C0392B', borderRadius: Radius.lg,
    padding: 16, ...Shadows.md,
  },
  panicIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  panicText: { flex: 1 },
  panicTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  panicSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: { width: '47%', flexGrow: 1, borderRadius: Radius.lg, padding: 16, gap: 8, minWidth: 140 },
  toolIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 15, fontWeight: '700' },
  toolSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
  footerNote: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18, marginTop: 8 },
});
