import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SavedStackParamList, Provider } from '../types';
import { Colors, Spacing, Typography, Radius, Shadows } from '../theme';
import { useSaved } from '../context/SavedContext';
import ProviderCard from '../components/ProviderCard';
import { FacilityCard } from '../components/FacilityCard';
import { EmptyState } from '../components/EmptyState';

type Props = NativeStackScreenProps<SavedStackParamList, 'Saved'>;

export default function SavedScreen({ navigation }: Props) {
  const { savedProviders, savedFacilities } = useSaved();
  const [activeTab, setActiveTab] = useState<'providers' | 'clinics'>('providers');

  const totalSaved = savedProviders.length + savedFacilities.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Saved</Text>
            {totalSaved > 0 && (
              <Text style={styles.headerSubtitle}>{totalSaved} item{totalSaved !== 1 ? 's' : ''} saved</Text>
            )}
          </View>
          {totalSaved > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{totalSaved}</Text>
            </View>
          )}
        </View>

        {/* Tab toggle */}
        {totalSaved > 0 && (
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'providers' && styles.tabBtnActive]}
              onPress={() => setActiveTab('providers')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'providers' && styles.tabBtnTextActive]}>
                Providers {savedProviders.length > 0 ? `(${savedProviders.length})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'clinics' && styles.tabBtnActive]}
              onPress={() => setActiveTab('clinics')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'clinics' && styles.tabBtnTextActive]}>
                Clinics {savedFacilities.length > 0 ? `(${savedFacilities.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {activeTab === 'providers' ? (
        savedProviders.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="No saved providers yet"
            description="When you save a provider, they'll appear here so you can easily compare and revisit their profiles."
            actionLabel="Discover Providers"
            onAction={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Home' })}
          />
        ) : (
          <FlatList
            data={savedProviders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderDetail', { providerId: item.id })} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<View style={styles.listHeaderPad} />}
          />
        )
      ) : (
        savedFacilities.length === 0 ? (
          <EmptyState
            icon="medical-outline"
            title="No saved clinics yet"
            description="Bookmark community clinics to save them here for easy access later."
            actionLabel="Discover Clinics"
            onAction={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Home' })}
          />
        ) : (
          <FlatList
            data={savedFacilities}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <FacilityCard facility={item} onPress={() => navigation.navigate('FacilityDetail', { facilityId: item.id })} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<View style={styles.listHeaderPad} />}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...Shadows.xs,
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  countBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  countBadgeText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tabRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.md, paddingBottom: 12,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.textInverse },
  listContent: { paddingBottom: 100 },
  listHeaderPad: { height: Spacing.md },
});
