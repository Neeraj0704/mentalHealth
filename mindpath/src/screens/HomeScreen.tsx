import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, StatusBar, FlatList,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Provider, Facility } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import ProviderCard from '../components/ProviderCard';
import { FacilityCard } from '../components/FacilityCard';
import {
  getTopRated, getNearby, getProviders,
  getTrendingSearches, saveTrendingSearch,
  getNearbyFacilities, getFacilities,
} from '../services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.82;

const SPECIALTIES = [
  { label: 'Anxiety', icon: 'pulse-outline' as const, color: Colors.primary },
  { label: 'Depression', icon: 'cloud-outline' as const, color: '#6BAF92' },
  { label: 'PTSD / Trauma', icon: 'shield-outline' as const, color: '#8B6BAF' },
];

const INSURANCES = ['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealth', 'Medicare', 'Medicaid'];
const CLINIC_SERVICES = ['Counseling', 'Psychiatry', 'Trauma', 'Family Therapy'];
const CLINIC_PAYMENTS = ['Free', 'Low-Cost', 'Medicaid'];
const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Still up?';
}

const IL_BOUNDS = { latMin: 36.9, latMax: 42.6, lngMin: -91.6, lngMax: -87.0 };
const CHICAGO = { lat: 41.8827, lng: -87.6294 };

export default function HomeScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<'providers' | 'clinics'>('providers');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [trending, setTrending] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clinics, setClinics] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<{ label: string } | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [providerRadius, setProviderRadius] = useState(25);
  const [clinicRadius, setClinicRadius] = useState(25);
  const [showSort, setShowSort] = useState(false);
  const [activeSort, setActiveSort] = useState('Top Rated');

  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  // Get location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const inIL = coords.lat >= IL_BOUNDS.latMin && coords.lat <= IL_BOUNDS.latMax &&
          coords.lng >= IL_BOUNDS.lngMin && coords.lng <= IL_BOUNDS.lngMax;
        setUserCoords(inIL ? coords : CHICAGO);
      } else {
        setUserCoords(CHICAGO);
      }
    })();
    getTrendingSearches().then(setTrending);
  }, []);

  // Load default data on mount
  useEffect(() => {
    loadTopRated();
    loadAllClinics();
  }, []);

  const fetchProvidersBySort = async (sort: string): Promise<Provider[]> => {
    const res = await fetch(`http://localhost:8000/providers?sort=${sort}&limit=100`);
    const data = await res.json();
    return data.providers as Provider[];
  };

  const loadTopRated = async () => {
    setLoading(true);
    try {
      const data = await getTopRated(50);
      setProviders(data);
      setActiveFilter({ label: 'Top Rated' });
    } catch {}
    setLoading(false);
  };

  const loadAllClinics = async () => {
    try {
      const data = await getFacilities();
      setClinics(data);
    } catch {}
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, { toValue: -SIDEBAR_WIDTH, duration: 240, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const applyProviderFilter = async (label: string, fetchFn: () => Promise<Provider[]>) => {
    closeSidebar();
    setActiveFilter({ label });
    setLoading(true);
    try {
      const data = await fetchFn();
      setProviders(data);
    } catch {}
    setLoading(false);
  };

  const applyClinicFilter = async (label: string, fetchFn: () => Promise<Facility[]>) => {
    closeSidebar();
    setActiveFilter({ label });
    try {
      const data = await fetchFn();
      setClinics(data);
    } catch {}
  };

  const handleSearch = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    await saveTrendingSearch(term);
    setTrending(await getTrendingSearches());
    navigation.navigate('Results', { query: term });
  };

  const clearFilter = () => {
    if (activeTab === 'providers') loadTopRated();
    else loadAllClinics();
    setActiveFilter(null);
  };

  const coords = userCoords ?? CHICAGO;

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  const renderSidebar = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
      <TouchableOpacity
        style={styles.sidebarSupportCard}
        onPress={() => { closeSidebar(); navigation.navigate('Wellness'); }}
        activeOpacity={0.85}
      >
        <Ionicons name="heart-outline" size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarSupportTitle}>Feeling overwhelmed?</Text>
          <Text style={styles.sidebarSupportSub}>Breathing, grounding and crisis support</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFilterBar = () => {
    const sortMap: Record<string, string> = { 'Top Rated': 'rating', 'Most Reviewed': 'reviews', 'Most Experienced': 'experience' };
    const SORT_OPTIONS = ['Top Rated', 'Most Reviewed', 'Most Experienced'];

    if (activeTab === 'providers') {
      return (
        <View style={styles.filterBar}>
          {/* Filters pill */}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => navigation.getParent()?.navigate('FilterModal', { currentFilters: {} as any })}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.filterBtnText}>Filters</Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Sort dropdown */}
          <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(v => !v)} activeOpacity={0.8}>
            <Ionicons name="swap-vertical-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.sortBtnText}>{activeSort}</Text>
            <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Scrollable chips: radius + specialty + insurance */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
            {RADIUS_OPTIONS.map(r => (
              <TouchableOpacity key={`r-${r}`}
                style={[styles.quickChip, providerRadius === r && styles.quickChipActive]}
                onPress={() => { setProviderRadius(r); r === 50 ? applyProviderFilter('All Providers', () => getTopRated(100)) : applyProviderFilter(`${r} mi`, () => getNearby(coords.lat, coords.lng, 100, r)); }}
                activeOpacity={0.8}>
                <Text style={[styles.quickChipText, providerRadius === r && styles.quickChipTextActive]}>{r === 50 ? 'Any' : `${r} mi`}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.chipDivider} />
            {SPECIALTIES.map(s => (
              <TouchableOpacity key={s.label}
                style={[styles.quickChip, activeFilter?.label === s.label && styles.quickChipActive]}
                onPress={() => applyProviderFilter(s.label, () => getProviders(undefined, s.label, s.label))}
                activeOpacity={0.8}>
                <Text style={[styles.quickChipText, activeFilter?.label === s.label && styles.quickChipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.chipDivider} />
            {INSURANCES.map(ins => (
              <TouchableOpacity key={ins}
                style={[styles.quickChip, activeFilter?.label === ins && styles.quickChipActive]}
                onPress={() => applyProviderFilter(ins, () => getProviders({ insurance: [ins], telehealth_only: false, in_person_only: false, accepting_new_patients: false, min_rating: 0, min_years_experience: 0, specialty: [], provider_type: [], language: [], gender: [], max_distance_miles: 0 }))}
                activeOpacity={0.8}>
                <Text style={[styles.quickChipText, activeFilter?.label === ins && styles.quickChipTextActive]}>{ins}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort sheet */}
          {showSort && (
            <View style={styles.sortSheet}>
              {SORT_OPTIONS.map(s => (
                <TouchableOpacity key={s} style={[styles.sortOption, activeSort === s && styles.sortOptionActive]}
                  onPress={() => { setActiveSort(s); setShowSort(false); applyProviderFilter(s, () => fetchProvidersBySort(sortMap[s])); }}
                  activeOpacity={0.8}>
                  <Text style={[styles.sortOptionText, activeSort === s && styles.sortOptionTextActive]}>{s}</Text>
                  {activeSort === s && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    // Clinics filter bar
    return (
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => navigation.getParent()?.navigate('ClinicFilterModal')} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
          {RADIUS_OPTIONS.map(r => (
            <TouchableOpacity key={`r-${r}`}
              style={[styles.quickChip, clinicRadius === r && styles.quickChipActive]}
              onPress={() => { setClinicRadius(r); r === 50 ? applyClinicFilter('All Clinics', () => getFacilities()) : applyClinicFilter(`${r} mi`, () => getNearbyFacilities(coords.lat, coords.lng, r)); }}
              activeOpacity={0.8}>
              <Text style={[styles.quickChipText, clinicRadius === r && styles.quickChipTextActive]}>{r === 50 ? 'Any' : `${r} mi`}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chipDivider} />
          {CLINIC_SERVICES.map(svc => (
            <TouchableOpacity key={svc}
              style={[styles.quickChip, activeFilter?.label === svc && styles.quickChipActive]}
              onPress={() => applyClinicFilter(svc, () => getFacilities({ q: svc }))}
              activeOpacity={0.8}>
              <Text style={[styles.quickChipText, activeFilter?.label === svc && styles.quickChipTextActive]}>{svc}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chipDivider} />
          {CLINIC_PAYMENTS.map(p => (
            <TouchableOpacity key={p}
              style={[styles.quickChip, activeFilter?.label === p && styles.quickChipActive]}
              onPress={() => applyClinicFilter(p, () => getFacilities({ free_only: p === 'Free', sliding_scale: p === 'Low-Cost' }))}
              activeOpacity={0.8}>
              <Text style={[styles.quickChipText, activeFilter?.label === p && styles.quickChipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#2E6A7E', '#4A8B9F']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openSidebar} style={styles.menuBtn}>
              <Ionicons name="menu-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerTitle}>Find your provider</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <Animated.View style={[styles.searchWrapper, { transform: [{ scale: inputScale }] }]}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={Colors.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="City, ZIP code, or provider name"
                placeholderTextColor={Colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                onFocus={() => Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true, friction: 8 }).start()}
                onBlur={() => Animated.spring(inputScale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch()}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()} activeOpacity={0.85}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* Recent searches */}
          {trending.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll} contentContainerStyle={{ gap: 8 }}>
              {trending.map(t => (
                <TouchableOpacity key={t} style={styles.trendingChip} onPress={() => handleSearch(t)}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.trendingText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'providers' && styles.tabBtnActive]}
          onPress={() => { setActiveTab('providers'); setActiveFilter(null); loadTopRated(); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'providers' && styles.tabBtnTextActive]}>Providers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'clinics' && styles.tabBtnActive]}
          onPress={() => { setActiveTab('clinics'); setActiveFilter(null); loadAllClinics(); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'clinics' && styles.tabBtnTextActive]}>Clinics</Text>
        </TouchableOpacity>
      </View>

      {/* Filter bar — switches based on active tab */}
      {renderFilterBar()}

      {/* Main list */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : activeTab === 'providers' ? (
        <FlatList
          data={providers}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderDetail', { providerId: item.id })} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No providers found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={f => String(f.id)}
          renderItem={({ item }) => (
            <FacilityCard facility={item} onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No clinics found</Text>
            </View>
          }
        />
      )}

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeSidebar} activeOpacity={1} />
        </Animated.View>
      )}

      {/* Sidebar panel */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}>
        <SafeAreaView edges={['top']} style={styles.sidebarHeader}>
          <View style={styles.sidebarHeaderRow}>
            <Text style={styles.sidebarTitle}>Discover</Text>
            <TouchableOpacity onPress={closeSidebar} style={styles.sidebarCloseBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {renderSidebar()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.md },
  headerInner: { paddingHorizontal: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm, marginBottom: Spacing.md, gap: 12 },
  menuBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '400' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, gap: 8, ...Shadows.sm },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  searchButton: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  trendingScroll: { marginBottom: 4 },
  trendingChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  trendingText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.primary, fontWeight: '700' },

  activeFilterRow: { paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  activeFilterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.primaryBg, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.primary + '44' },
  activeFilterText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  filterBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    gap: 8, position: 'relative',
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterDivider: { width: 1, height: 18, backgroundColor: Colors.border },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 7 },
  sortBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  quickChipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  quickChipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  quickChipTextActive: { color: Colors.primary, fontWeight: '600' },
  chipDivider: { width: 1, height: 18, backgroundColor: Colors.border, alignSelf: 'center' },
  sortSheet: {
    position: 'absolute', top: 50, left: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: 4, width: 200, zIndex: 100, ...Shadows.lg,
  },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: Radius.sm },
  sortOptionActive: { backgroundColor: Colors.primaryBg },
  sortOptionText: { fontSize: 14, color: Colors.textSecondary },
  sortOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  listContent: { paddingTop: Spacing.md, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textTertiary },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: Colors.surface, zIndex: 11, ...Shadows.lg },
  sidebarHeader: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  sidebarHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  sidebarTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  sidebarCloseBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sidebarContent: { padding: Spacing.md, gap: 12, paddingBottom: 60 },
  sidebarSupportCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a3a47', borderRadius: Radius.lg, padding: 14, marginBottom: 4 },
  sidebarSupportTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  sidebarSupportSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sidebarSection: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },

  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specialtyCard: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5 },
  specialtyLabel: { fontSize: 13, fontWeight: '600' },
});
