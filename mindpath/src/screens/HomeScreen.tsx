import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Provider } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { ProviderMiniCard } from '../components/ProviderMiniCard';
import {
  getTopRated, getNearby,
  getTrendingSearches, saveTrendingSearch,
} from '../services/api';
import { getPreferences } from '../services/preferences';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const BROWSE_SPECIALTIES = [
  { label: 'Anxiety',       icon: 'heart-outline'   as const, color: '#EEF6F9', iconColor: Colors.primary },
  { label: 'Depression',    icon: 'sunny-outline'   as const, color: '#EEF7F2', iconColor: Colors.secondary },
  { label: 'Trauma & PTSD', icon: 'shield-outline'  as const, color: '#F7EEF9', iconColor: '#8B6BAF' },
  { label: 'Relationships', icon: 'people-outline'  as const, color: '#FDF0E8', iconColor: Colors.accent },
  { label: 'ADHD',          icon: 'flash-outline'   as const, color: '#EEFAF5', iconColor: '#48A999' },
  { label: 'Grief & Loss',  icon: 'leaf-outline'    as const, color: '#F9F0EE', iconColor: '#AF6B6B' },
];

const INSURANCE_OPTIONS = [
  { label: 'Aetna', color: '#EEF6F9' },
  { label: 'Blue Cross Blue Shield', color: '#EEF7F2' },
  { label: 'Cigna', color: '#F7EEF9' },
  { label: 'UnitedHealth', color: '#FDF0E8' },
  { label: 'Medicare', color: '#EEFAF5' },
  { label: 'Medicaid', color: '#F9F0EE' },
];

interface Section {
  key: string;
  title: string;
  data: Provider[];
  loading: boolean;
}

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Still up?';
}

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [trending, setTrending] = useState<string[]>([]);
  const [nearbyRadius, setNearbyRadius] = useState(25);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sections, setSections] = useState<Record<string, { data: Provider[]; loading: boolean }>>({
    nearby:   { data: [], loading: true },
    topRated: { data: [], loading: true },
    forYou:   { data: [], loading: true },
  });

  const inputScale = useRef(new Animated.Value(1)).current;

  const setSection = (key: string, data: Provider[], loading: boolean) => {
    setSections(prev => ({ ...prev, [key]: { data, loading } }));
  };

  useEffect(() => {
    getTrendingSearches().then(setTrending);
    getPreferences().then(p => {
      setNearbyRadius(p.maxDistanceMiles);
      loadSections(p.maxDistanceMiles, p);
    });
  }, []);

  const loadSections = async (radius?: number, prefs?: Awaited<ReturnType<typeof getPreferences>>) => {
    const [topRated] = await Promise.allSettled([getTopRated(10)]);
    setSection('topRated', topRated.status === 'fulfilled' ? topRated.value : [], false);
    await loadNearbyAndForYou(radius, prefs);
  };

  const loadNearbyAndForYou = async (radius?: number, prefs?: Awaited<ReturnType<typeof getPreferences>>) => {
    const r = radius ?? nearbyRadius;
    setSection('nearby', [], true);
    setSection('forYou', [], true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };

        // Illinois bounds fallback (providers are Chicago-area only)
        const IL_BOUNDS = { latMin: 36.9, latMax: 42.6, lngMin: -91.6, lngMax: -87.0 };
        const CHICAGO = { lat: 41.8827, lng: -87.6294 };
        const inIllinois = coords.lat >= IL_BOUNDS.latMin && coords.lat <= IL_BOUNDS.latMax &&
          coords.lng >= IL_BOUNDS.lngMin && coords.lng <= IL_BOUNDS.lngMax;
        const searchCoords = inIllinois ? coords : CHICAGO;
        setUserCoords(searchCoords);

        const [nearby, forYouRaw] = await Promise.all([
          getNearby(searchCoords.lat, searchCoords.lng, 10, r),
          prefs ? getNearby(searchCoords.lat, searchCoords.lng, 20, prefs.maxDistanceMiles) : Promise.resolve([]),
        ]);
        setSection('nearby', nearby, false);

        // Apply preference filters client-side
        let forYou = forYouRaw;
        if (prefs?.insurance) {
          forYou = forYou.filter(p => p.insurance_accepted.some(ins =>
            ins.toLowerCase().includes(prefs.insurance.toLowerCase())
          ));
        }
        if (prefs?.providerGenderPreference && prefs.providerGenderPreference !== 'No preference') {
          forYou = forYou.filter(p => p.gender === prefs.providerGenderPreference);
        }
        setSection('forYou', forYou, false);
      } else {
        setSection('nearby', [], false);
        setSection('forYou', [], false);
      }
    } catch {
      setSection('nearby', [], false);
      setSection('forYou', [], false);
    }
  };

  const loadNearby = async (radius?: number) => {
    const r = radius ?? nearbyRadius;
    setSection('nearby', [], true);
    if (userCoords) {
      try {
        const nearby = await getNearby(userCoords.lat, userCoords.lng, 10, r);
        setSection('nearby', nearby, false);
      } catch {
        setSection('nearby', [], false);
      }
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const nearby = await getNearby(loc.coords.latitude, loc.coords.longitude, 10, r);
        setSection('nearby', nearby, false);
      } else {
        setSection('nearby', [], false);
      }
    } catch {
      setSection('nearby', [], false);
    }
  };

  const handleRadiusChange = (r: number) => {
    setNearbyRadius(r);
    loadNearby(r);
  };

  const handleFocus = () => Animated.spring(inputScale, { toValue: 1.02, useNativeDriver: true, friction: 8 }).start();
  const handleBlur  = () => Animated.spring(inputScale, { toValue: 1,    useNativeDriver: true, friction: 8 }).start();

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    await saveTrendingSearch(q);
    setTrending(await getTrendingSearches());
    navigation.navigate('Results', { query: q });
  };

  const goToProvider = (id: string) => navigation.navigate('ProviderDetail', { providerId: id });
  const goToResults  = (params: Parameters<typeof navigation.navigate>[1]) =>
    navigation.navigate('Results', params as any);

  const renderMiniList = (data: Provider[], loading: boolean) => {
    if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginLeft: Spacing.md }} />;
    if (!data.length) return null;
    return (
      <FlatList
        horizontal
        data={data}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProviderMiniCard provider={item} onPress={() => goToProvider(item.id)} />
        )}
      />
    );
  };

  const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2E6A7E', '#4A8B9F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerTitle}>Find your provider</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.searchWrapper, { transform: [{ scale: inputScale }] }]}>
            <View style={styles.searchBar}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="City, ZIP code, or provider name"
                placeholderTextColor={Colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                onFocus={handleFocus}
                onBlur={handleBlur}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch()}
                autoCapitalize="words"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()} activeOpacity={0.85}>
              <Ionicons name="search" size={20} color={Colors.textInverse} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trending Searches */}
        {trending.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recent Searches" />
            <View style={styles.chipRow}>
              {trending.map(t => (
                <TouchableOpacity key={t} style={styles.trendingChip} onPress={() => handleSearch(t)}>
                  <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                  <Text style={styles.trendingChipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Near You */}
        {(sections.nearby.loading || sections.nearby.data.length > 0) && (
          <View style={styles.section}>
            <SectionHeader
              title="Near You"
              onSeeAll={() => goToResults({ query: 'Chicago' })}
            />
            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, nearbyRadius === r && styles.radiusChipActive]}
                  onPress={() => handleRadiusChange(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.radiusChipText, nearbyRadius === r && styles.radiusChipTextActive]}>
                    {r === 50 ? 'Any' : `${r} mi`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderMiniList(sections.nearby.data, sections.nearby.loading)}
          </View>
        )}

        {/* Top Rated */}
        <View style={styles.section}>
          <SectionHeader
            title="Top Rated"
            onSeeAll={() => goToResults({ query: '', specialty: undefined })}
          />
          {renderMiniList(sections.topRated.data, sections.topRated.loading)}
        </View>

        {/* For You */}
        {(sections.forYou.loading || sections.forYou.data.length > 0) && (
          <View style={styles.section}>
            <SectionHeader
              title="Based on Your Preferences"
              onSeeAll={() => goToResults({ query: '' })}
            />
            {renderMiniList(sections.forYou.data, sections.forYou.loading)}
          </View>
        )}

        {/* Browse by Specialty */}
        <View style={styles.section}>
          <SectionHeader title="Browse by Specialty" />
          <View style={styles.specialtyGrid}>
            {BROWSE_SPECIALTIES.map(spec => (
              <TouchableOpacity
                key={spec.label}
                style={[styles.specialtyCard, { backgroundColor: spec.color }]}
                onPress={() => goToResults({ query: '', specialty: spec.label })}
                activeOpacity={0.8}
              >
                <View style={[styles.specialtyIcon, { backgroundColor: spec.iconColor + '22' }]}>
                  <Ionicons name={spec.icon} size={22} color={spec.iconColor} />
                </View>
                <Text style={[styles.specialtyLabel, { color: spec.iconColor }]}>{spec.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse by Insurance */}
        <View style={styles.section}>
          <SectionHeader title="Browse by Insurance" />
          <View style={styles.chipRow}>
            {INSURANCE_OPTIONS.map(ins => (
              <TouchableOpacity
                key={ins.label}
                style={[styles.insuranceChip, { backgroundColor: ins.color }]}
                onPress={() => goToResults({ query: '', filters: { insurance: [ins.label] } as any })}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark-outline" size={12} color={Colors.primary} />
                <Text style={styles.insuranceChipText}>{ins.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={[styles.section, styles.howCard]}>
          <Text style={styles.howTitle}>How MindPath works</Text>
          {[
            { num: '1', text: 'Search by city, ZIP, or specialty' },
            { num: '2', text: 'Filter by insurance, language, and more' },
            { num: '3', text: 'Read profiles and reviews' },
            { num: '4', text: 'Book directly or save for later' },
          ].map(step => (
            <View key={step.num} style={styles.howStep}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{step.num}</Text>
              </View>
              <Text style={styles.howText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { paddingBottom: Spacing.xl },
  headerInner:  { paddingHorizontal: Spacing.md },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  greeting:    { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '400', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textInverse, letterSpacing: -0.3 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12, gap: 8, ...Shadows.sm,
  },
  searchInput:  { flex: 1, fontSize: 15, color: Colors.textPrimary },
  searchButton: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
  },
  scrollView:   { flex: 1 },
  scrollContent:{ paddingTop: Spacing.lg, paddingBottom: 100 },
  section:      { marginBottom: Spacing.xl },
  sectionHeader:{
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  seeAll:       { fontSize: 13, fontWeight: '600', color: Colors.primary },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.md },
  trendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.xs,
  },
  trendingChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  insuranceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  insuranceChipText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  specialtyGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, paddingHorizontal: Spacing.md,
  },
  specialtyCard: {
    width: '30%', flexGrow: 1, borderRadius: Radius.md,
    padding: 14, alignItems: 'center', gap: 8, minWidth: 95,
  },
  specialtyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  specialtyLabel:{ fontSize: 12, fontWeight: '600', textAlign: 'center' },
  radiusRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.md,
    marginBottom: 10,
  },
  radiusChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  radiusChipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  radiusChipText: {
    fontSize: 12, fontWeight: '500', color: Colors.textSecondary,
  },
  radiusChipTextActive: {
    color: Colors.primary, fontWeight: '700',
  },
  howCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginHorizontal: Spacing.md, ...Shadows.sm,
  },
  howTitle: { ...Typography.heading4, marginBottom: Spacing.md },
  howStep:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  howNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  howNumText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  howText:    { fontSize: 14, color: Colors.textSecondary, flex: 1 },

});
