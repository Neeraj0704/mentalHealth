import React, { useState, Fragment } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { FilterChip } from '../components/ui/FilterChip';
import { useClinicFilters, DEFAULT_CLINIC_FILTERS, ClinicFilters } from '../context/ClinicFilterContext';

const DISTANCE_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '2 mi', value: 2 },
  { label: '5 mi', value: 5 },
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
];

function DistanceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const selIdx = Math.max(0, DISTANCE_OPTIONS.findIndex(o => o.value === value));
  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.trackRow}>
        {DISTANCE_OPTIONS.map((opt, i) => (
          <Fragment key={opt.value}>
            {i > 0 && <View style={[sliderStyles.line, i <= selIdx && sliderStyles.lineActive]} />}
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
          <Text key={opt.value} style={[sliderStyles.label, i === selIdx && sliderStyles.labelActive]}>{opt.label}</Text>
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 4 },
  trackRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  line: { flex: 1, height: 3, backgroundColor: Colors.border },
  lineActive: { backgroundColor: Colors.primary },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 2.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotSelected: { width: 22, height: 22, borderRadius: 11 },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: Colors.textTertiary, fontWeight: '400', textAlign: 'center', minWidth: 36 },
  labelActive: { color: Colors.primary, fontWeight: '700' },
});

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicFilterModal'>;

const LANGUAGE_OPTIONS = ['Spanish', 'Chinese', 'Mandarin', 'Polish', 'Hindi', 'Russian', 'Arabic', 'Korean'];
const SERVICE_OPTIONS = ['Counseling', 'Psychiatry', 'Trauma', 'Family Therapy', 'ADHD', 'Domestic Violence', 'Substance Abuse', 'Grief'];

export default function ClinicFilterModal({ navigation }: Props) {
  const { clinicFilters, setClinicFilters, resetClinicFilters } = useClinicFilters();
  const [local, setLocal] = useState<ClinicFilters>({ ...clinicFilters });

  const handleApply = () => {
    setClinicFilters(local);
    navigation.goBack();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_CLINIC_FILTERS });
    resetClinicFilters();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clinic Filters</Text>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.resetText}>Reset all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Distance */}
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Distance From Me</Text>
              {local.distance > 0 && <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>{local.distance} mi</Text>}
            </View>
            <DistanceSlider value={local.distance} onChange={(v) => setLocal({ ...local, distance: v })} />
          </View>

          {/* Cost */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost</Text>
            <View style={styles.chipWrap}>
              {([
                { key: 'free', label: 'Free' },
                { key: 'sliding', label: 'Sliding Scale' },
                { key: 'medicaid', label: 'Medicaid' },
              ] as const).map(opt => (
                <FilterChip
                  key={opt.key}
                  label={opt.label}
                  selected={local.cost === opt.key}
                  onPress={() => setLocal({ ...local, cost: local.cost === opt.key ? null : opt.key })}
                />
              ))}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: Colors.primaryBg }]}>
                  <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>Telehealth</Text>
                  <Text style={styles.toggleSub}>Video or phone sessions</Text>
                </View>
              </View>
              <Switch
                value={local.telehealth}
                onValueChange={(v) => setLocal({ ...local, telehealth: v })}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>
          </View>

          {/* Language */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language</Text>
            <View style={styles.chipWrap}>
              {LANGUAGE_OPTIONS.map(lang => (
                <FilterChip
                  key={lang}
                  label={lang}
                  selected={local.language === lang}
                  onPress={() => setLocal({ ...local, language: local.language === lang ? null : lang })}
                />
              ))}
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Type</Text>
            <View style={styles.chipWrap}>
              {SERVICE_OPTIONS.map(svc => (
                <FilterChip
                  key={svc}
                  label={svc}
                  selected={local.service === svc}
                  onPress={() => setLocal({ ...local, service: local.service === svc ? null : svc })}
                />
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyText}>Show Clinics</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.heading4 },
  resetText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: 24, paddingBottom: 40 },
  section: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, gap: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  footer: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.surface },
  applyBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  applyText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
