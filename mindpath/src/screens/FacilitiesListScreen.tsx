import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Facility } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { FacilityCard } from '../components/FacilityCard';
import { getNearbyFacilities } from '../services/api';
import { useClinicFilters } from '../context/ClinicFilterContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'FacilitiesList'>;

export default function FacilitiesListScreen({ navigation, route }: Props) {
  const { facilities: initialFacilities, lat, lng } = route.params;
  const { clinicFilters, activeClinicFilterCount } = useClinicFilters();
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const CHICAGO = { lat: 41.8827, lng: -87.6294 };
        const IL_BOUNDS = { latMin: 36.9, latMax: 42.6, lngMin: -91.6, lngMax: -87.0 };
        const inIllinois = lat >= IL_BOUNDS.latMin && lat <= IL_BOUNDS.latMax &&
          lng >= IL_BOUNDS.lngMin && lng <= IL_BOUNDS.lngMax;
        const coords = inIllinois ? { lat, lng } : CHICAGO;
        // distance=0 means "Any" — use default 25mi since this is "Clinics Near Me"
        const radius = clinicFilters.distance > 0 ? clinicFilters.distance : 25;

        let data = await getNearbyFacilities(coords.lat, coords.lng, radius);
        if (clinicFilters.cost === 'free') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('free')));
        if (clinicFilters.cost === 'sliding') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('sliding')));
        if (clinicFilters.cost === 'medicaid') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('medicaid')));
        if (clinicFilters.telehealth) data = data.filter(f => f.telehealth);
        if (clinicFilters.language) data = data.filter(f => f.languages.some(l => l.toLowerCase().includes(clinicFilters.language!.toLowerCase())));
        if (clinicFilters.service) data = data.filter(f => f.keywords?.toLowerCase().includes(clinicFilters.service!.toLowerCase()));

        if (!cancelled) setFacilities(data);
      } catch {
        if (!cancelled) setFacilities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clinicFilters, lat, lng]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Clinics Near Me</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Searching…' : `${facilities.length} clinics found`}
          </Text>
        </View>
      </SafeAreaView>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterBtn, activeClinicFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => navigation.getParent()?.navigate('ClinicFilterModal')}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={16} color={activeClinicFilterCount > 0 ? Colors.textInverse : Colors.textSecondary} />
          <Text style={[styles.filterBtnText, activeClinicFilterCount > 0 && styles.filterBtnTextActive]}>
            Filters{activeClinicFilterCount > 0 ? ` · ${activeClinicFilterCount}` : ''}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingRight: 4 }}>
          {['Counseling', 'Psychiatry', 'Trauma', 'Family Therapy', 'ADHD'].map(svc => {
            const active = clinicFilters.service === svc;
            return (
              <TouchableOpacity
                key={svc}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {/* opens modal to set service */}}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{svc}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={f => String(f.id)}
          renderItem={({ item }) => (
            <FacilityCard
              facility={item}
              onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1,
    borderBottomColor: Colors.divider, ...Shadows.xs, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  titleSection: { flex: 1 },
  title: { ...Typography.heading4, letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },
  filterBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterBtnTextActive: { color: Colors.textInverse },
  divider: { width: 1, height: 18, backgroundColor: Colors.border, marginHorizontal: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { paddingTop: Spacing.md, paddingBottom: 100 },
});
