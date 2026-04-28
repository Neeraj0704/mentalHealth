import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Provider, SearchFilters, Facility } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { getProviders, getNearby, getFacilities, getNearbyFacilities } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useClinicFilters } from '../context/ClinicFilterContext';
import ProviderCard from '../components/ProviderCard';
import { FacilityCard } from '../components/FacilityCard';
import { LoadingCard } from '../components/LoadingCard';
import { EmptyState } from '../components/EmptyState';
import { useFilters } from '../context/FilterContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'Results'>;

const SORT_OPTIONS = [
  { key: 'rating', label: 'Top Rated' },
  { key: 'experience', label: 'Most Experienced' },
  { key: 'reviews', label: 'Most Reviewed' },
  { key: 'available', label: 'Available Soon' },
];

function applyFilters(providers: Provider[], filters: SearchFilters): Provider[] {
  return providers.filter((p) => {
    if (filters.telehealth_only && !p.telehealth_available) return false;
    if (filters.in_person_only && !p.in_person_available) return false;
    if (filters.accepting_new_patients && !p.accepting_new_patients) return false;
    if (filters.min_rating > 0 && p.rating < filters.min_rating) return false;
    if (filters.min_years_experience > 0 && p.years_experience < filters.min_years_experience) return false;
    if (filters.specialty.length && !filters.specialty.some((s) => p.specialties.includes(s))) return false;
    if (filters.provider_type.length && !filters.provider_type.includes(p.provider_type)) return false;
    if (filters.insurance.length && !filters.insurance.some((ins) => p.insurance_accepted.includes(ins))) return false;
    if (filters.language.length && !filters.language.some((l) => p.languages.includes(l))) return false;
    if (filters.gender.length && !filters.gender.includes(p.gender)) return false;
    return true;
  });
}

function sortProviders(providers: Provider[], key: string): Provider[] {
  const sorted = [...providers];
  switch (key) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'experience':
      return sorted.sort((a, b) => b.years_experience - a.years_experience);
    case 'reviews':
      return sorted.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
    default:
      return sorted;
  }
}

export default function ResultsScreen({ navigation, route }: Props) {
  const { query, specialty } = route.params;
  const { filters, activeFilterCount, resetFilters } = useFilters();
  const { userLocation, locationGranted, locationLoading, locationDenied, openLocationSettings } = useLocation();
  const [activeTab, setActiveTab] = useState<'providers' | 'clinics'>('providers');
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clinics, setClinics] = useState<Facility[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [sortKey, setSortKey] = useState('rating');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const sortSheetAnim = useRef(new Animated.Value(0)).current;

  const { clinicFilters, activeClinicFilterCount } = useClinicFilters();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      console.log('[Results] load() — max_distance_miles:', filters.max_distance_miles, 'locationLoading:', locationLoading, 'locationGranted:', locationGranted, 'userLocation:', userLocation);
      try {
        let data: Provider[];
        if (filters.max_distance_miles > 0 && locationLoading) {
          console.log('[Results] waiting for location...');
          return;
        }
        if (filters.max_distance_miles > 0 && locationGranted && userLocation) {
          // If device is outside Illinois bounds, fall back to Chicago center
          const IL_BOUNDS = { latMin: 36.9, latMax: 42.6, lngMin: -91.6, lngMax: -87.0 };
          const CHICAGO = { lat: 41.8827, lng: -87.6294 };
          const inIllinois = userLocation.lat >= IL_BOUNDS.latMin && userLocation.lat <= IL_BOUNDS.latMax &&
            userLocation.lng >= IL_BOUNDS.lngMin && userLocation.lng <= IL_BOUNDS.lngMax;
          const searchLoc = inIllinois ? userLocation : CHICAGO;
          console.log('[Results] calling getNearby lat:', searchLoc.lat, 'lng:', searchLoc.lng, 'radius:', filters.max_distance_miles, 'inIllinois:', inIllinois);
          data = await getNearby(searchLoc.lat, searchLoc.lng, 500, filters.max_distance_miles);
          console.log('[Results] getNearby returned', data.length, 'providers');
          const cond = selectedChip ?? specialty;
          if (cond) {
            data = data.filter(p =>
              p.specialties.some(s => s.toLowerCase().includes(cond.toLowerCase())) ||
              p.conditions_treated.some(c => c.toLowerCase().includes(cond.toLowerCase()))
            );
          }
        } else if (filters.max_distance_miles > 0 && locationDenied) {
          console.log('[Results] location denied, showing empty');
          data = [];
        } else {
          console.log('[Results] calling getProviders, query:', query);
          data = await getProviders(filters, query, selectedChip ?? specialty);
          console.log('[Results] getProviders returned', data.length, 'providers');
        }
        if (!cancelled) {
          const results = applyFilters(data, filters);
          setProviders(sortProviders(results, sortKey));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [filters, sortKey, query, specialty, selectedChip, userLocation, locationGranted, locationLoading]);

  useEffect(() => {
    let cancelled = false;
    const loadClinics = async () => {
      setClinicsLoading(true);
      try {
        const q = query || selectedChip || specialty || clinicFilters.service || '';
        const IL_BOUNDS = { latMin: 36.9, latMax: 42.6, lngMin: -91.6, lngMax: -87.0 };
        const CHICAGO = { lat: 41.8827, lng: -87.6294 };

        let data;
        if (clinicFilters.distance > 0 && userLocation) {
          const inIllinois = userLocation.lat >= IL_BOUNDS.latMin && userLocation.lat <= IL_BOUNDS.latMax &&
            userLocation.lng >= IL_BOUNDS.lngMin && userLocation.lng <= IL_BOUNDS.lngMax;
          const coords = inIllinois ? userLocation : CHICAGO;
          data = await getNearbyFacilities(coords.lat, coords.lng, clinicFilters.distance);
          if (q) data = data.filter(f => f.name.toLowerCase().includes(q.toLowerCase()) || f.keywords?.toLowerCase().includes(q.toLowerCase()));
          if (clinicFilters.telehealth) data = data.filter(f => f.telehealth);
          if (clinicFilters.language) data = data.filter(f => f.languages.some(l => l.toLowerCase().includes(clinicFilters.language!.toLowerCase())));
          if (clinicFilters.cost === 'free') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('free')));
          if (clinicFilters.cost === 'sliding') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('sliding')));
          if (clinicFilters.cost === 'medicaid') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('medicaid')));
        } else {
          data = await getFacilities({
            q: q || undefined,
            free_only: clinicFilters.cost === 'free',
            sliding_scale: clinicFilters.cost === 'sliding',
            telehealth_only: clinicFilters.telehealth,
            language: clinicFilters.language || undefined,
          });
          if (clinicFilters.cost === 'medicaid') data = data.filter(f => f.payment.some(p => p.toLowerCase().includes('medicaid')));
        }
        if (!cancelled) setClinics(data);
      } catch {
        if (!cancelled) setClinics([]);
      } finally {
        if (!cancelled) setClinicsLoading(false);
      }
    };
    loadClinics();
    return () => { cancelled = true; };
  }, [query, selectedChip, specialty, clinicFilters, userLocation]);

  const toggleSortSheet = () => {
    if (!showSortSheet) {
      setShowSortSheet(true);
      Animated.timing(sortSheetAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sortSheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowSortSheet(false));
    }
  };

  const handleProviderPress = (provider: Provider) => {
    navigation.navigate('ProviderDetail', { providerId: provider.id });
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? 'Sort';

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.resultsCount}>
        {loading ? 'Searching...' : `${providers.length >= 500 ? '500+' : providers.length} providers found`}
      </Text>
      {!loading && providers.length > 0 && !!query && (
        <Text style={styles.resultsSubtitle}>in {query}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {query || 'All Providers'}
            </Text>
            <Text style={styles.subtitle}>
              {specialty ? `Specialists in ${specialty}` : 'Mental health providers'}
            </Text>
          </View>
        </View>

        {/* Filter / Sort bar — switches based on active tab */}
        {activeTab === 'providers' ? (
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
              onPress={() => navigation.getParent()?.navigate('FilterModal', { currentFilters: filters })}
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? Colors.textInverse : Colors.textSecondary} />
              <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>
                Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
              </Text>
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <TouchableOpacity style={styles.sortBtn} onPress={toggleSortSheet} activeOpacity={0.8}>
              <Ionicons name="swap-vertical-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.sortBtnText}>{currentSortLabel}</Text>
              <Ionicons name={showSortSheet ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <ScrollableFilterChips selected={selectedChip} onSelect={setSelectedChip} />
          </View>
        ) : (
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
            <View style={styles.filterDivider} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingRight: 4 }}>
              {['Counseling', 'Psychiatry', 'Trauma', 'Family Therapy', 'ADHD'].map(svc => {
                const active = clinicFilters.service === svc;
                return (
                  <TouchableOpacity key={svc} style={[styles.quickFilterChip, active && styles.quickFilterChipActive]} onPress={() => {}} activeOpacity={0.8}>
                    <Text style={[styles.quickFilterChipText, active && styles.quickFilterChipTextActive]}>{svc}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Providers / Clinics tab toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'providers' && styles.tabBtnActive]}
            onPress={() => setActiveTab('providers')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'providers' && styles.tabBtnTextActive]}>
              Providers {!loading ? `(${providers.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'clinics' && styles.tabBtnActive]}
            onPress={() => setActiveTab('clinics')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'clinics' && styles.tabBtnTextActive]}>
              Clinics {!clinicsLoading ? `(${clinics.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Sort sheet overlay */}
      {showSortSheet && (
        <TouchableOpacity
          style={styles.sortOverlay}
          onPress={toggleSortSheet}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.sortSheet,
              {
                opacity: sortSheetAnim,
                transform: [
                  {
                    translateY: sortSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortOption,
                  sortKey === opt.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortKey(opt.key);
                  toggleSortSheet();
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortKey === opt.key && styles.sortOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {sortKey === opt.key && (
                  <Ionicons name="checkmark" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      )}

      {filters.max_distance_miles > 0 && locationDenied && (
        <TouchableOpacity style={styles.locationBanner} onPress={openLocationSettings} activeOpacity={0.8}>
          <Ionicons name="location-outline" size={16} color="#b45309" />
          <Text style={styles.locationBannerText}>
            Location access needed for distance filter.{' '}
            <Text style={styles.locationBannerLink}>Open Settings</Text>
          </Text>
        </TouchableOpacity>
      )}

      {activeTab === 'providers' ? (
        loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((k) => <LoadingCard key={k} />)}
          </View>
        ) : providers.length === 0 && filters.max_distance_miles > 0 && locationDenied ? (
          <EmptyState
            icon="location-outline"
            title="Location access needed"
            description="Enable location access to find providers near you. Tap the banner above to open Settings."
            actionLabel="Open Settings"
            onAction={openLocationSettings}
          />
        ) : providers.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No providers found"
            description={`We couldn't find providers matching your search${query ? ` for "${query}"` : ''}. Try adjusting your filters.`}
            actionLabel="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProviderCard provider={item} onPress={() => handleProviderPress(item)} />
            )}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        clinicsLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((k) => <LoadingCard key={k} />)}
          </View>
        ) : clinics.length === 0 ? (
          <EmptyState
            icon="medical-outline"
            title="No clinics found"
            description={`No community clinics match your search${query ? ` for "${query}"` : ''}.`}
            actionLabel="View All Clinics"
            onAction={() => setClinics([])}
          />
        ) : (
          <FlatList
            data={clinics}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <FacilityCard
                facility={item}
                onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

// Small inline chip scroller for quick specialty filters
function ScrollableFilterChips({ selected, onSelect }: { selected: string | null; onSelect: (c: string | null) => void }) {
  const chips = ['Anxiety', 'Depression', 'Trauma', 'ADHD', 'Couples'];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 6, paddingRight: 4 }}
    >
      {chips.map((c) => (
        <TouchableOpacity
          key={c}
          style={[
            styles.quickFilterChip,
            selected === c && styles.quickFilterChipActive,
          ]}
          onPress={() => onSelect(selected === c ? null : c)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.quickFilterChipText,
              selected === c && styles.quickFilterChipTextActive,
            ]}
          >
            {c}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...Shadows.xs,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.textInverse,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  locationBannerText: {
    fontSize: 13,
    color: '#92400e',
    flex: 1,
  },
  locationBannerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...Typography.heading4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.textInverse,
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  quickFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickFilterChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  quickFilterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  quickFilterChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  listHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultsCount: {
    ...Typography.heading4,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  loadingContainer: {
    paddingTop: Spacing.md,
  },
  sortOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  sortSheet: {
    position: 'absolute',
    top: 130,
    left: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    width: 200,
    zIndex: 101,
    ...Shadows.lg,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  sortOptionActive: {
    backgroundColor: Colors.primaryBg,
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
