import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SavedStackParamList, Provider } from '../types';
import { Colors, Spacing, Typography, Radius, Shadows } from '../theme';
import { useSaved } from '../context/SavedContext';
import ProviderCard from '../components/ProviderCard';
import { EmptyState } from '../components/EmptyState';

type Props = NativeStackScreenProps<SavedStackParamList, 'Saved'>;

export default function SavedScreen({ navigation }: Props) {
  const { savedProviders } = useSaved();

  const handlePress = (provider: Provider) => {
    navigation.navigate('ProviderDetail', { providerId: provider.id });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Saved</Text>
            {savedProviders.length > 0 && (
              <Text style={styles.headerSubtitle}>
                {savedProviders.length} provider{savedProviders.length !== 1 ? 's' : ''} saved
              </Text>
            )}
          </View>
          {savedProviders.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{savedProviders.length}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {savedProviders.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="No saved providers yet"
          description="When you save a provider, they'll appear here so you can easily compare and revisit their profiles."
          actionLabel="Discover Providers"
          onAction={() =>
            navigation.getParent()?.navigate('HomeTab', { screen: 'Home' })
          }
        />
      ) : (
        <FlatList
          data={savedProviders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProviderCard provider={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeaderPad} />
          }
        />
      )}
    </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  countBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: 100,
  },
  listHeaderPad: {
    height: Spacing.md,
  },
});
