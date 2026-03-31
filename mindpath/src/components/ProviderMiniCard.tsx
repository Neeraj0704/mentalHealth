import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from '../types';
import { Colors, Radius, Shadows } from '../theme';

interface Props {
  provider: Provider;
  onPress: () => void;
}

export const ProviderMiniCard: React.FC<Props> = ({ provider, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
    <Image
      source={{ uri: provider.image }}
      style={styles.image}
    />
    {provider.verified && (
      <View style={styles.verifiedDot}>
        <Ionicons name="checkmark" size={8} color="#fff" />
      </View>
    )}
    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
      <Text style={styles.type} numberOfLines={1}>{provider.provider_type}</Text>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={11} color={Colors.rating} />
        <Text style={styles.rating}>
          {provider.rating ? provider.rating.toFixed(1) : '—'}
        </Text>
        {provider.review_count > 0 && (
          <Text style={styles.reviewCount}>({provider.review_count})</Text>
        )}
      </View>
      <Text style={styles.city} numberOfLines={1}>
        {provider.city}, {provider.state}
      </Text>
      <View style={styles.badges}>
        {provider.telehealth_available && (
          <View style={[styles.badge, { backgroundColor: Colors.primaryBg }]}>
            <Ionicons name="videocam-outline" size={9} color={Colors.primary} />
            <Text style={[styles.badgeText, { color: Colors.primary }]}>Virtual</Text>
          </View>
        )}
        {provider.accepting_new_patients && (
          <View style={[styles.badge, { backgroundColor: Colors.secondaryBg }]}>
            <Text style={[styles.badgeText, { color: Colors.secondary }]}>Accepting</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginRight: 12,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 110,
    backgroundColor: Colors.surfaceAlt,
  },
  verifiedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  type: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  city: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
