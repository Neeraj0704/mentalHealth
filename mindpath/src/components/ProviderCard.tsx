import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from '../types';
import { Colors, Shadows, Radius, Spacing, Typography } from '../theme';
import { Badge } from './ui/Badge';
import { RatingStars } from './ui/RatingStars';
import { useSaved } from '../context/SavedContext';

interface ProviderCardProps {
  provider: Provider;
  onPress: () => void;
  style?: object;
}

const { width } = Dimensions.get('window');

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onPress,
  style,
}) => {
  const { toggleSaved, isSaved } = useSaved();
  const saved = isSaved(provider.id);

  const handleSave = () => {
    toggleSaved(provider);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.96}
      style={[styles.card, style]}
    >
      {/* Top row: avatar + main info + save button */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: provider.image }} style={styles.avatar} />
          {provider.verified && (
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={9} color={Colors.textInverse} />
            </View>
          )}
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {provider.name}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? Colors.primary : Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.credentials} numberOfLines={1}>
            {provider.credentials}
          </Text>

          <View style={styles.providerTypePill}>
            <Text style={styles.providerTypeText}>{provider.provider_type}</Text>
          </View>

          <RatingStars
            rating={provider.rating}
            reviewCount={provider.rating_count}
            size="sm"
          />
        </View>
      </View>

      {/* Practice & location */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {provider.practice_name}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.metaText}>
            {provider.city}, {provider.state}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.metaText}>{provider.years_experience} yrs exp</Text>
        </View>
      </View>

      {/* Snippet */}
      <Text style={styles.snippet} numberOfLines={2}>
        {provider.overview}
      </Text>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        {provider.telehealth_available && (
          <Badge
            label="Telehealth"
            variant="telehealth"
            icon="videocam-outline"
          />
        )}
        {provider.in_person_available && (
          <Badge label="In-Person" variant="inPerson" icon="location-outline" />
        )}
        {provider.accepting_new_patients ? (
          <Badge label="Accepting Patients" variant="newPatients" />
        ) : (
          <Badge label="Waitlist" variant="warning" />
        )}
      </View>

      {/* Insurance preview + next available */}
      <View style={styles.footer}>
        <View style={styles.insuranceRow}>
          {provider.insurance_accepted.slice(0, 2).map((ins) => (
            <View key={ins} style={styles.insuranceChip}>
              <Text style={styles.insuranceText} numberOfLines={1}>
                {ins}
              </Text>
            </View>
          ))}
          {provider.insurance_accepted.length > 2 && (
            <View style={styles.insuranceChip}>
              <Text style={styles.insuranceText}>
                +{provider.insurance_accepted.length - 2}
              </Text>
            </View>
          )}
        </View>

        {provider.next_available && (
          <View style={styles.nextAvailRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.secondary}
            />
            <Text style={styles.nextAvailText}>{provider.next_available}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    ...Shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceAlt,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    ...Typography.heading4,
    flex: 1,
    marginRight: 4,
  },
  saveBtn: {
    padding: 2,
  },
  credentials: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  providerTypePill: {
    backgroundColor: Colors.surfaceAlt,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  providerTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  snippet: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  insuranceChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  insuranceText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  nextAvailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nextAvailText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.secondary,
  },
});

export default ProviderCard;
