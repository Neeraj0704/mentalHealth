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
import { HomeStackParamList, Provider, SearchFilters } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { getProviders } from '../services/api';
import ProviderCard from '../components/ProviderCard';
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
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sortKey, setSortKey] = useState('rating');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const sortSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    getProviders(filters, query, selectedChip ?? specialty)
      .then((data) => {
        const results = applyFilters(data, filters);
        setProviders(sortProviders(results, sortKey));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, sortKey, query, specialty, selectedChip]);

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
        {loading ? 'Searching...' : `${providers.length} providers found`}
      </Text>
      {!loading && providers.length > 0 && (
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
              {query}
            </Text>
            <Text style={styles.subtitle}>Mental health providers</Text>
          </View>
        </View>

        {/* Filter / Sort bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeFilterCount > 0 && styles.filterBtnActive,
            ]}
            onPress={() => navigation.getParent()?.navigate('FilterModal', { currentFilters: filters })}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={activeFilterCount > 0 ? Colors.textInverse : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterBtnText,
                activeFilterCount > 0 && styles.filterBtnTextActive,
              ]}
            >
              Filters
              {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          <TouchableOpacity
            style={styles.sortBtn}
            onPress={toggleSortSheet}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.sortBtnText}>{currentSortLabel}</Text>
            <Ionicons
              name={showSortSheet ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          <ScrollableFilterChips selected={selectedChip} onSelect={setSelectedChip} />
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

      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((k) => (
            <LoadingCard key={k} />
          ))}
        </View>
      ) : providers.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No providers found"
          description={`We couldn't find mental health providers matching your current filters in ${query}. Try adjusting your search.`}
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
