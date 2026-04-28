import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { savePreferences } from '../services/preferences';

type Props = NativeStackScreenProps<RootStackParamList, 'PreferencesSetup'>;

const AGE_OPTIONS = ['18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'];
const INSURANCE_OPTIONS = ['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid', 'Self-pay'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'Chinese', 'Mandarin', 'Polish', 'Hindi', 'Russian', 'Arabic'];
const PROVIDER_GENDER_OPTIONS = ['No preference', 'Female', 'Male'];
const DISTANCE_OPTIONS = [{ label: '2 mi', value: 2 }, { label: '5 mi', value: 5 }, { label: '10 mi', value: 10 }, { label: '25 mi', value: 25 }, { label: 'Any', value: 50 }];
const SESSION_OPTIONS = [
  { label: 'Any', value: 'any' as const, icon: 'apps-outline' as const },
  { label: 'Telehealth', value: 'telehealth' as const, icon: 'videocam-outline' as const },
  { label: 'In-Person', value: 'in-person' as const, icon: 'location-outline' as const },
];
const SERVICE_OPTIONS = ['Counseling', 'Psychiatry', 'Trauma', 'ADHD', 'Family Therapy', 'Substance Abuse', 'Grief'];
const COST_OPTIONS = [
  { label: 'Any', value: 'any' as const },
  { label: 'Free', value: 'free' as const },
  { label: 'Sliding Scale', value: 'sliding' as const },
  { label: 'Accepts Medicaid', value: 'medicaid' as const },
];

function Chip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress} activeOpacity={0.8}>
      {icon && <Ionicons name={icon} size={13} color={selected ? Colors.primary : Colors.textSecondary} />}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function SectionGroupHeader({ label }: { label: string }) {
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupHeaderText}>{label}</Text>
    </View>
  );
}

export default function OnboardingPreferencesScreen({ navigation }: Props) {
  const [ageGroup, setAgeGroup] = useState('Prefer not to say');
  const [insurance, setInsurance] = useState('');
  const [language, setLanguage] = useState('');
  const [providerGender, setProviderGender] = useState('No preference');
  const [maxDistance, setMaxDistance] = useState(25);
  const [sessionType, setSessionType] = useState<'any' | 'telehealth' | 'in-person'>('any');
  const [serviceType, setServiceType] = useState('');
  const [costPreference, setCostPreference] = useState<'any' | 'free' | 'sliding' | 'medicaid'>('any');
  const [saving, setSaving] = useState(false);

  const goToApp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleContinue = async () => {
    setSaving(true);
    await savePreferences({
      ageGroup, insurance, language,
      providerGenderPreference: providerGender,
      maxDistanceMiles: maxDistance,
      sessionType, serviceType, costPreference,
    });
    goToApp();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your preferences</Text>
            <Text style={styles.headerSub}>Help us show you the most relevant providers and clinics.</Text>
          </View>
          <TouchableOpacity onPress={goToApp} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ABOUT YOU */}
        <SectionGroupHeader label="About you" />

        <SectionCard title="Your age group">
          <View style={styles.chipRow}>
            {AGE_OPTIONS.map(a => (
              <Chip key={a} label={a} selected={ageGroup === a} onPress={() => setAgeGroup(a)} />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Your insurance" subtitle="We'll show providers and clinics that accept your plan.">
          <View style={styles.chipRow}>
            {INSURANCE_OPTIONS.map(ins => (
              <Chip key={ins} label={ins} selected={insurance === ins} onPress={() => setInsurance(ins === insurance ? '' : ins)} />
            ))}
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Or type your insurance plan…"
            placeholderTextColor={Colors.textTertiary}
            value={insurance}
            onChangeText={setInsurance}
          />
        </SectionCard>

        <SectionCard title="Language you prefer" subtitle="We'll prioritize providers and clinics that speak your language.">
          <View style={styles.chipRow}>
            {LANGUAGE_OPTIONS.map(l => (
              <Chip key={l} label={l} selected={language === l} onPress={() => setLanguage(l === language ? '' : l)} />
            ))}
          </View>
        </SectionCard>

        {/* PROVIDER PREFERENCES */}
        <SectionGroupHeader label="Provider & clinic preferences" />

        <SectionCard title="Session type" subtitle="How would you like to meet your provider?">
          <View style={styles.chipRow}>
            {SESSION_OPTIONS.map(opt => (
              <Chip key={opt.value} label={opt.label} icon={opt.icon} selected={sessionType === opt.value} onPress={() => setSessionType(opt.value)} />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Provider gender" subtitle="Do you have a preference for your provider's gender?">
          <View style={styles.chipRow}>
            {PROVIDER_GENDER_OPTIONS.map(g => (
              <Chip key={g} label={g} selected={providerGender === g} onPress={() => setProviderGender(g)} />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Maximum distance" subtitle="How far are you willing to travel?">
          <View style={styles.chipRow}>
            {DISTANCE_OPTIONS.map(d => (
              <Chip key={d.value} label={d.label} selected={maxDistance === d.value} onPress={() => setMaxDistance(d.value)} />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Service you're looking for" subtitle="We'll surface providers and clinics that specialise in this area.">
          <View style={styles.chipRow}>
            {SERVICE_OPTIONS.map(s => (
              <Chip key={s} label={s} selected={serviceType === s} onPress={() => setServiceType(s === serviceType ? '' : s)} />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Cost preference" subtitle="Filter clinics by what you can afford.">
          <View style={styles.chipRow}>
            {COST_OPTIONS.map(opt => (
              <Chip key={opt.value} label={opt.label} selected={costPreference === opt.value} onPress={() => setCostPreference(opt.value)} />
            ))}
          </View>
        </SectionCard>

        <View style={{ height: 24 }} />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>{saving ? 'Saving…' : 'Save & Continue'}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    paddingHorizontal: Spacing.md, paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: Spacing.sm, gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  skipBtn: { paddingLeft: 8 },
  skipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, paddingTop: 4 },
  content: { padding: Spacing.md, gap: 12, paddingBottom: 20 },
  groupHeader: { marginTop: 8, marginBottom: 4 },
  groupHeaderText: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: 12, ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: -6, lineHeight: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  textInput: {
    height: 44, backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md, paddingHorizontal: 14,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  footer: {
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.divider,
    paddingHorizontal: Spacing.md, paddingTop: 12,
  },
  continueBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
