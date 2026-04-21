import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius } from '../theme';
import { savePreferences } from '../services/preferences';

type Props = NativeStackScreenProps<RootStackParamList, 'PreferencesSetup'>;

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AGE_OPTIONS = ['18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'];
const RACE_OPTIONS = [
  'Asian / Pacific Islander', 'Black / African American', 'Hispanic / Latino',
  'Native American', 'White / Caucasian', 'Multiracial', 'Other', 'Prefer not to say',
];
const PROVIDER_GENDER = ['No preference', 'Female', 'Male', 'Non-binary'];
const DISTANCE_OPTIONS = [2, 5, 10, 25, 50];
const COMMON_INSURANCES = [
  'Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid', 'Self-pay',
];

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export default function OnboardingPreferencesScreen({ navigation }: Props) {
  const [gender, setGender] = useState('Prefer not to say');
  const [ageGroup, setAgeGroup] = useState('Prefer not to say');
  const [race, setRace] = useState('Prefer not to say');
  const [insurance, setInsurance] = useState('');
  const [providerGender, setProviderGender] = useState('No preference');
  const [maxDistance, setMaxDistance] = useState(25);
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);

  const goToScreening = () => {
    navigation.reset({
      index: 0,
      routes: [{
        name: 'MainTabs',
        state: {
          routes: [{
            name: 'HomeTab',
            state: { routes: [{ name: 'Home' }, { name: 'Assessment' }], index: 1 },
          }],
          index: 0,
        },
      }],
    });
  };

  const handleContinue = async () => {
    setSaving(true);
    await savePreferences({ gender, ageGroup, race, insurance, providerGenderPreference: providerGender, maxDistanceMiles: maxDistance, anonymousMode: anonymous });
    goToScreening();
  };

  const handleSkip = () => {
    goToScreening();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Personalize your experience</Text>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Help us show you the most relevant providers.</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <SectionLabel text="Your gender" />
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map(g => (
            <OptionChip key={g} label={g} selected={gender === g} onPress={() => setGender(g)} />
          ))}
        </View>

        <SectionLabel text="Age group" />
        <View style={styles.chipRow}>
          {AGE_OPTIONS.map(a => (
            <OptionChip key={a} label={a} selected={ageGroup === a} onPress={() => setAgeGroup(a)} />
          ))}
        </View>

        <SectionLabel text="Race / Ethnicity (optional)" />
        <View style={styles.chipRow}>
          {RACE_OPTIONS.map(r => (
            <OptionChip key={r} label={r} selected={race === r} onPress={() => setRace(r)} />
          ))}
        </View>

        <SectionLabel text="Insurance" />
        <View style={styles.chipRow}>
          {COMMON_INSURANCES.map(ins => (
            <OptionChip key={ins} label={ins} selected={insurance === ins} onPress={() => setInsurance(ins === insurance ? '' : ins)} />
          ))}
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="Or type your insurance plan…"
          placeholderTextColor={Colors.textTertiary}
          value={insurance}
          onChangeText={setInsurance}
        />

        <SectionLabel text="Provider gender preference" />
        <View style={styles.chipRow}>
          {PROVIDER_GENDER.map(g => (
            <OptionChip key={g} label={g} selected={providerGender === g} onPress={() => setProviderGender(g)} />
          ))}
        </View>

        <SectionLabel text="Maximum distance" />
        <View style={styles.chipRow}>
          {DISTANCE_OPTIONS.map(d => (
            <OptionChip
              key={d}
              label={d === 50 ? 'Any distance' : `${d} miles`}
              selected={maxDistance === d}
              onPress={() => setMaxDistance(d)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setAnonymous(!anonymous)} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Anonymous browsing</Text>
            <Text style={styles.toggleSub}>Hide your info from providers until you choose to connect</Text>
          </View>
          <View style={[styles.toggle, anonymous && styles.toggleOn]}>
            <View style={[styles.toggleThumb, anonymous && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>{saving ? 'Saving…' : 'Continue'}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, lineHeight: 19 },
  skipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  content: { padding: Spacing.md, paddingBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  textInput: {
    marginTop: 10, height: 44,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: 20, backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  toggle: {
    width: 46, height: 26, borderRadius: 13,
    backgroundColor: Colors.border,
    padding: 2, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.divider,
    paddingHorizontal: Spacing.md, paddingTop: 12,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
