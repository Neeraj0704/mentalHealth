import React, { useState, Fragment } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SearchFilters, DEFAULT_FILTERS, ProviderType, Gender } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { FilterChip } from '../components/ui/FilterChip';
import {
  SPECIALTIES,
  PROVIDER_TYPES,
  INSURANCE_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../data/mockProviders';
import { useFilters } from '../context/FilterContext';

type Props = NativeStackScreenProps<RootStackParamList, 'FilterModal'>;

const DISTANCE_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '5 mi', value: 5 },
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '50 mi', value: 50 },
];

function DistanceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const selIdx = Math.max(0, DISTANCE_OPTIONS.findIndex(o => o.value === value));
  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.trackRow}>
        {DISTANCE_OPTIONS.map((opt, i) => (
          <Fragment key={opt.value}>
            {i > 0 && (
              <View style={[sliderStyles.trackLine, i <= selIdx && sliderStyles.trackLineActive]} />
            )}
            <TouchableOpacity onPress={() => onChange(opt.value)} hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }} activeOpacity={0.75}>
              <View style={[sliderStyles.dot, i <= selIdx && sliderStyles.dotActive, i === selIdx && sliderStyles.dotSelected]}>
                {i === selIdx && <View style={sliderStyles.dotInner} />}
              </View>
            </TouchableOpacity>
          </Fragment>
        ))}
      </View>
      <View style={sliderStyles.labelsRow}>
        {DISTANCE_OPTIONS.map((opt, i) => (
          <Text key={opt.value} style={[sliderStyles.label, i === selIdx && sliderStyles.labelActive]}>
            {opt.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 4 },
  trackRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  trackLine: { flex: 1, height: 3, backgroundColor: Colors.border },
  trackLineActive: { backgroundColor: Colors.primary },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 2.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotSelected: { width: 22, height: 22, borderRadius: 11 },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: Colors.textTertiary, fontWeight: '400', textAlign: 'center', minWidth: 36 },
  labelActive: { color: Colors.primary, fontWeight: '700' },
});

const GENDER_OPTIONS: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const RATING_OPTIONS = [
  { label: '4.5+', value: 4.5 },
  { label: '4.0+', value: 4.0 },
  { label: '3.5+', value: 3.5 },
];
const EXPERIENCE_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '3+ yrs', value: 3 },
  { label: '7+ yrs', value: 7 },
  { label: '15+ yrs', value: 15 },
];

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function FilterScreen({ navigation }: Props) {
  const { filters, setFilters, resetFilters, activeFilterCount } = useFilters();
  const [local, setLocal] = useState<SearchFilters>({ ...filters });

  const handleApply = () => {
    setFilters(local);
    navigation.goBack();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_FILTERS });
    resetFilters();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.resetText}>Reset all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Distance */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleInline}>Distance From Me</Text>
              {local.max_distance_miles > 0 && (
                <Text style={styles.sectionValue}>{local.max_distance_miles} mi</Text>
              )}
            </View>
            <DistanceSlider
              value={local.max_distance_miles}
              onChange={(v) => setLocal({ ...local, max_distance_miles: v })}
            />
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: Colors.primaryBg }]}>
                    <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.toggleLabel}>Telehealth</Text>
                    <Text style={styles.toggleSub}>Video / phone sessions</Text>
                  </View>
                </View>
                <Switch
                  value={local.telehealth_only}
                  onValueChange={(v) => setLocal({ ...local, telehealth_only: v, in_person_only: v ? false : local.in_person_only })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.surface}
                />
              </View>
              <View style={styles.toggleItem}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: Colors.secondaryBg }]}>
                    <Ionicons name="location-outline" size={18} color={Colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.toggleLabel}>In-Person</Text>
                    <Text style={styles.toggleSub}>Office visits</Text>
                  </View>
                </View>
                <Switch
                  value={local.in_person_only}
                  onValueChange={(v) => setLocal({ ...local, in_person_only: v, telehealth_only: v ? false : local.telehealth_only })}
                  trackColor={{ false: Colors.border, true: Colors.secondary }}
                  thumbColor={Colors.surface}
                />
              </View>
              <View style={styles.toggleItem}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: Colors.accentBg }]}>
                    <Ionicons name="person-add-outline" size={18} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.toggleLabel}>Accepting New Patients</Text>
                    <Text style={styles.toggleSub}>Available to take on new clients</Text>
                  </View>
                </View>
                <Switch
                  value={local.accepting_new_patients}
                  onValueChange={(v) => setLocal({ ...local, accepting_new_patients: v })}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor={Colors.surface}
                />
              </View>
            </View>
          </View>

          {/* Specialty */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialty</Text>
            <View style={styles.chipGrid}>
              {SPECIALTIES.slice(0, 12).map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  selected={local.specialty.includes(s)}
                  onPress={() => setLocal({ ...local, specialty: toggle(local.specialty, s) })}
                  size="sm"
                />
              ))}
            </View>
          </View>

          {/* Provider Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Type</Text>
            <View style={styles.chipGrid}>
              {PROVIDER_TYPES.map((t) => (
                <FilterChip
                  key={t}
                  label={t}
                  selected={local.provider_type.includes(t as ProviderType)}
                  onPress={() =>
                    setLocal({
                      ...local,
                      provider_type: toggle(local.provider_type, t as ProviderType),
                    })
                  }
                  size="sm"
                />
              ))}
            </View>
          </View>

          {/* Minimum Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.chipRow}>
              <FilterChip
                label="Any"
                selected={local.min_rating === 0}
                onPress={() => setLocal({ ...local, min_rating: 0 })}
                size="sm"
              />
              {RATING_OPTIONS.map((r) => (
                <FilterChip
                  key={r.value}
                  label={`★ ${r.label}`}
                  selected={local.min_rating === r.value}
                  onPress={() => setLocal({ ...local, min_rating: r.value })}
                  size="sm"
                />
              ))}
            </View>
          </View>

          {/* Insurance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Accepted</Text>
            <View style={styles.chipGrid}>
              {INSURANCE_OPTIONS.map((ins) => (
                <FilterChip
                  key={ins}
                  label={ins}
                  selected={local.insurance.includes(ins)}
                  onPress={() =>
                    setLocal({ ...local, insurance: toggle(local.insurance, ins) })
                  }
                  size="sm"
                />
              ))}
            </View>
          </View>

          {/* Language */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language</Text>
            <View style={styles.chipGrid}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <FilterChip
                  key={lang}
                  label={lang}
                  selected={local.language.includes(lang)}
                  onPress={() =>
                    setLocal({ ...local, language: toggle(local.language, lang) })
                  }
                  size="sm"
                />
              ))}
            </View>
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Gender</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) => (
                <FilterChip
                  key={g}
                  label={g}
                  selected={local.gender.includes(g)}
                  onPress={() =>
                    setLocal({ ...local, gender: toggle(local.gender, g) })
                  }
                  size="sm"
                />
              ))}
            </View>
          </View>

          {/* Years of Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Years of Experience</Text>
            <View style={styles.chipRow}>
              {EXPERIENCE_OPTIONS.map((exp) => (
                <FilterChip
                  key={exp.value}
                  label={exp.label}
                  selected={local.min_years_experience === exp.value}
                  onPress={() =>
                    setLocal({ ...local, min_years_experience: exp.value })
                  }
                  size="sm"
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.88}
          >
            <Text style={styles.applyBtnText}>
              Apply Filters{activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading3,
    fontSize: 17,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleInline: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleRow: {
    gap: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: 14,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 17,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
