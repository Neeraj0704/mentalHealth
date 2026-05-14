import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, StatusBar, FlatList,
  ActivityIndicator, Dimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { ProviderMiniCard } from '../components/ProviderMiniCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { HomeStackParamList, Provider, Facility } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import ProviderCard from '../components/ProviderCard';
import { FacilityCard } from '../components/FacilityCard';
import {
  getTopRated, getNearby, getProviders,
  getTrendingSearches, saveTrendingSearch,
  getNearbyFacilities, getFacilities,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

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

const IL_ZIP_COORDS: Record<string, [number, number]> = {
  // Chicago city
  "60601": [41.8858, -87.6181], "60602": [41.8827, -87.6290], "60603": [41.8796, -87.6294],
  "60604": [41.8765, -87.6294], "60605": [41.8672, -87.6229], "60606": [41.8827, -87.6377],
  "60607": [41.8726, -87.6554], "60608": [41.8479, -87.6640], "60609": [41.8145, -87.6499],
  "60610": [41.9003, -87.6341], "60611": [41.8969, -87.6231], "60612": [41.8797, -87.6818],
  "60613": [41.9533, -87.6587], "60614": [41.9236, -87.6487], "60615": [41.8008, -87.5947],
  "60616": [41.8413, -87.6229], "60617": [41.7230, -87.5520], "60618": [41.9451, -87.7006],
  "60619": [41.7477, -87.6008], "60620": [41.7425, -87.6501], "60621": [41.7755, -87.6453],
  "60622": [41.9006, -87.6779], "60623": [41.8479, -87.7181], "60624": [41.8797, -87.7181],
  "60625": [41.9726, -87.7034], "60626": [42.0050, -87.6652], "60628": [41.6936, -87.6230],
  "60629": [41.7766, -87.7103], "60630": [41.9726, -87.7577], "60631": [41.9958, -87.8089],
  "60632": [41.8145, -87.7181], "60634": [41.9452, -87.8006], "60636": [41.7766, -87.6768],
  "60637": [41.7808, -87.5947], "60638": [41.7862, -87.7759], "60639": [41.9201, -87.7759],
  "60640": [41.9726, -87.6534], "60641": [41.9452, -87.7577], "60642": [41.9058, -87.6588],
  "60643": [41.7007, -87.6556], "60644": [41.8797, -87.7577], "60645": [42.0101, -87.6877],
  "60646": [41.9958, -87.7577], "60647": [41.9201, -87.7034], "60649": [41.7614, -87.5639],
  "60651": [41.9003, -87.7434], "60652": [41.7477, -87.7181], "60653": [41.8208, -87.5947],
  "60654": [41.8907, -87.6354], "60655": [41.7007, -87.7103], "60656": [41.9773, -87.8428],
  "60657": [41.9402, -87.6488], "60659": [41.9906, -87.7006], "60660": [41.9906, -87.6534],
  "60661": [41.8827, -87.6457], "60706": [41.9625, -87.8428], "60707": [41.9201, -87.8428],
  "60714": [42.0050, -87.8428], "60076": [42.0374, -87.7034], "60077": [42.0374, -87.7577],
  "60201": [42.0374, -87.6877], "60202": [42.0374, -87.7006], "60301": [41.8858, -87.7888],
  "60302": [41.9003, -87.7888], "60304": [41.8672, -87.7888], "60402": [41.8479, -87.8297],
  "60453": [41.7192, -87.7888], "60455": [41.7862, -87.8428], "60457": [41.7307, -87.8428],
  "60459": [41.7625, -87.8994], "60462": [41.6094, -87.8297], "60465": [41.7477, -87.8994],
  "60525": [41.8145, -87.8994], "60526": [41.8308, -87.9170], "60534": [41.8308, -87.8688],
  "60546": [41.8308, -87.8428],
  // North suburbs
  "60062": [42.1253, -87.8362], "60068": [41.9992, -87.8428], "60035": [42.1842, -87.8011],
  "60093": [42.1078, -87.7357], "60015": [42.1717, -87.8439], "60048": [42.2775, -87.9534],
  "60091": [42.0742, -87.6865], "60025": [42.0742, -87.8231], "60026": [42.0847, -87.8341],
  "60004": [42.0956, -87.9806], "60005": [42.0664, -87.9806], "60016": [42.0197, -87.8800],
  "60061": [42.2364, -87.9534], "60069": [42.1939, -87.8517], "60089": [42.1728, -87.9534],
  "60010": [42.1531, -88.0645], "60064": [42.3247, -87.8678],
  // West suburbs
  "60521": [41.8056, -87.9367], "60523": [41.8477, -87.9534], "60515": [41.7886, -88.0118],
  "60532": [41.7728, -88.0645], "60561": [41.7478, -87.9700], "60126": [41.8886, -87.9367],
  "60148": [41.8478, -88.0231], "60187": [41.8617, -88.1062], "60189": [41.8617, -88.1367],
  "60190": [41.8617, -88.1645], "60173": [42.0331, -88.0340], "60169": [42.0609, -88.0645],
  "60141": [41.8728, -87.8428], "60153": [41.8858, -87.8428], "60134": [41.8978, -88.3176],
  "60504": [41.7478, -88.1062], "60506": [41.7728, -88.3534], "60540": [41.7728, -88.1534],
  "60563": [41.7978, -88.1645], "60564": [41.7228, -88.2062],
  // Southwest suburbs
  "60423": [41.5111, -87.8231], "60435": [41.5228, -88.1062], "60463": [41.6478, -87.8678],
  "60467": [41.5978, -87.8994], "60544": [41.6228, -88.0534],
  // South suburbs
  "60914": [41.1728, -87.8678],
  // Northwest suburbs
  "60174": [42.0331, -88.2534],
  // Downstate Illinois
  "61704": [40.5145, -88.9937], "61820": [40.1164, -88.2434], "61821": [40.1164, -88.2434],
  "61801": [40.1164, -88.2434], "62701": [39.7817, -89.6501], "62703": [39.7617, -89.6234],
  "62711": [39.7817, -89.6934], "61832": [40.1478, -87.6294], "61107": [42.2711, -88.9937],
  "61614": [40.7228, -89.5734], "62901": [37.7228, -89.2234],
  "60085": [42.3611, -87.8400], "60031": [42.3764, -87.9534], "60045": [42.2228, -87.9367],
};

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
  const { user } = useAuth();
  const [showSort, setShowSort] = useState(false);
  const [activeSort, setActiveSort] = useState('Top Rated');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const mapCardListRef = useRef<FlatList>(null);
  const mapRef = useRef<MapView>(null);

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

  const getProviderCoords = (p: Provider): [number, number] | null => {
    const zip = p.zip_code?.trim();
    return zip && IL_ZIP_COORDS[zip] ? IL_ZIP_COORDS[zip] : null;
  };

  const getClinicCoords = (f: Facility): [number, number] | null => {
    const zip = f.zip?.trim();
    return zip && IL_ZIP_COORDS[zip] ? IL_ZIP_COORDS[zip] : null;
  };

  const handlePinPress = (id: string | number, coords: [number, number]) => {
    setSelectedId(id);
    // Pan map to pin
    mapRef.current?.animateToRegion({ latitude: coords[0], longitude: coords[1], latitudeDelta: 0.05, longitudeDelta: 0.05 }, 400);
    // Scroll card list to selected item
    const items = activeTab === 'providers' ? providers : clinics;
    const idx = items.findIndex(item => item.id === id);
    if (idx >= 0) {
      mapCardListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  };

  const renderMapView = () => {
    const CHICAGO_REGION: Region = { latitude: 41.8827, longitude: -87.6294, latitudeDelta: 0.15, longitudeDelta: 0.15 };
    const items = activeTab === 'providers' ? providers : clinics;

    return (
      <View style={{ flex: 1 }}>
        {/* Map — top portion */}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={CHICAGO_REGION}
          showsUserLocation
          showsMyLocationButton
          onPress={() => setSelectedId(null)}
        >
          {activeTab === 'providers'
            ? providers.map(p => {
                const c = getProviderCoords(p);
                if (!c) return null;
                const selected = selectedId === p.id;
                return (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: c[0], longitude: c[1] }}
                    pinColor={selected ? Colors.accent : Colors.primary}
                    onPress={() => handlePinPress(p.id, c)}
                  />
                );
              })
            : clinics.map(f => {
                const c = getClinicCoords(f);
                if (!c) return null;
                const selected = selectedId === f.id;
                const isFree = f.payment.some(p => p.toLowerCase().includes('free'));
                return (
                  <Marker
                    key={f.id}
                    coordinate={{ latitude: c[0], longitude: c[1] }}
                    pinColor={selected ? Colors.accent : isFree ? '#16a34a' : '#b45309'}
                    onPress={() => handlePinPress(f.id, c)}
                  />
                );
              })
          }
        </MapView>

        {/* Horizontal card list — bottom */}
        <View style={styles.mapCardContainer}>
          <FlatList
            ref={mapCardListRef}
            horizontal
            data={items as any[]}
            keyExtractor={item => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mapCardList}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => {
              const selected = selectedId === item.id;
              if (activeTab === 'providers') {
                const c = getProviderCoords(item);
                return (
                  <View key={item.id} style={[styles.mapCardWrap, selected && styles.mapCardWrapSelected]}>
                    <ProviderMiniCard
                      provider={item}
                      onPress={() => {
                        if (c) handlePinPress(item.id, c);
                        navigation.navigate('ProviderDetail', { providerId: item.id });
                      }}
                    />
                  </View>
                );
              }
              const c = getClinicCoords(item);
              const isFree = item.payment?.some((p: string) => p.toLowerCase().includes('free'));
              return (
                <TouchableOpacity
                  style={[styles.mapClinicCard, selected && styles.mapCardWrapSelected]}
                  onPress={() => {
                    if (c) handlePinPress(item.id, c);
                    navigation.navigate('FacilityDetail', { facilityId: item.id });
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.mapClinicCostTag, { backgroundColor: isFree ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={[styles.mapClinicCostText, { color: isFree ? '#16a34a' : '#b45309' }]}>
                      {isFree ? 'Free' : 'Low-Cost'}
                    </Text>
                  </View>
                  <Text style={styles.mapClinicName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.mapClinicAddress} numberOfLines={1}>{item.address}</Text>
                  {item.telehealth && (
                    <View style={styles.mapClinicBadge}>
                      <Ionicons name="videocam-outline" size={10} color={Colors.primary} />
                      <Text style={styles.mapClinicBadgeText}>Telehealth</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    );
  };

  const fetchProvidersBySort = async (sort: string): Promise<Provider[]> => {
    const res = await fetch(`${BASE_URL}/providers?sort=${sort}&limit=100`);
    const data = await res.json();
    return data.providers as Provider[];
  };

  const loadTopRated = async () => {
    setLoading(true);
    try {
      const data = await getTopRated(500);
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
      {/* Feeling overwhelmed */}
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

      {/* Quick Screening */}
      <TouchableOpacity
        style={styles.sidebarSupportCard}
        onPress={() => {
          closeSidebar();
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'Home' },
                { name: 'Assessment', params: { hideSkip: true } },
              ],
            })
          );
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="clipboard-outline" size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.sidebarSupportTitle}>Quick Screening</Text>
          <Text style={styles.sidebarSupportSub}>Answer a few questions to find the right providers</Text>
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
              <Text style={styles.greeting}>{getGreeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}</Text>
              <Text style={styles.headerTitle}>{activeTab === 'clinics' ? 'Find a clinic' : 'Find your mental health provider'}</Text>
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

      {/* Tab toggle + view mode */}
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

        {/* List / Map toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')} activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('map')} activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter bar — only in list mode */}
      {viewMode === 'list' && renderFilterBar()}

      {/* Main content */}
      {viewMode === 'map' ? renderMapView() : loading ? (
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
  viewToggle: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', paddingRight: 4, gap: 2 },
  viewToggleBtn: { padding: 6, borderRadius: 8 },
  viewToggleBtnActive: { backgroundColor: Colors.primaryBg },
  mapCardContainer: {
    height: 220, backgroundColor: Colors.background,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  mapCardList: { paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 12 },
  mapCardWrap: { borderRadius: Radius.lg, borderWidth: 2, borderColor: 'transparent' },
  mapCardWrapSelected: { borderColor: Colors.primary },
  mapClinicCard: {
    width: 160, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 12, ...Shadows.sm, borderWidth: 2, borderColor: 'transparent',
  },
  mapClinicCostTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginBottom: 6 },
  mapClinicCostText: { fontSize: 11, fontWeight: '700' },
  mapClinicName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4, lineHeight: 16 },
  mapClinicAddress: { fontSize: 10, color: Colors.textTertiary, marginBottom: 4 },
  mapClinicBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mapClinicBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: '500' },

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
  sidebarSectionSub: { fontSize: 12, color: Colors.textTertiary, marginTop: -6 },
  screeningChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  screeningChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },

  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specialtyCard: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5 },
  specialtyLabel: { fontSize: 13, fontWeight: '600' },
});
