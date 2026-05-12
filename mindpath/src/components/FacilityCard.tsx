import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Facility } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { Badge } from './ui/Badge';
import { useSaved } from '../context/SavedContext';

interface Props {
  facility: Facility;
  onPress: () => void;
}

export function FacilityCard({ facility, onPress }: Props) {
  const { toggleSavedFacility, isFacilitySaved } = useSaved();
  const saved = isFacilitySaved(facility.id);
  const isFree = facility.payment.some(p => p.toLowerCase().includes('free'));
  const isSliding = facility.payment.some(p => p.toLowerCase().includes('sliding'));
  const costLabel = isFree ? 'Free' : isSliding ? 'Low-Cost' : 'Low-Cost';
  const costColor = isFree ? '#16a34a' : '#b45309';
  const costBg = isFree ? '#dcfce7' : '#fef3c7';
  const serviceText = facility.services?.join('; ') || facility.keywords || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.96}>
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical-outline" size={30} color={Colors.primary} />
        </View>
        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { flex: 1 }]} numberOfLines={2}>{facility.name}</Text>
            <TouchableOpacity
              onPress={() => toggleSavedFacility(facility)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 2 }}
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? Colors.primary : Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.costPill, { backgroundColor: costBg }]}>
            <Text style={[styles.costPillText, { color: costColor }]}>{costLabel}</Text>
          </View>
          {facility.inpatient_outpatient ? (
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{facility.inpatient_outpatient}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.metaText} numberOfLines={1}>{facility.address}</Text>
        </View>
        {facility.phone ? (
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{facility.phone}</Text>
          </View>
        ) : null}
        {facility.hours ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.metaText} numberOfLines={1}>{facility.hours}</Text>
          </View>
        ) : null}
      </View>

      {!!serviceText && (
        <Text style={styles.snippet} numberOfLines={2}>{serviceText}</Text>
      )}

      <View style={styles.badgesRow}>
        {facility.telehealth && (
          <Badge label="Telehealth" variant="telehealth" icon="videocam-outline" />
        )}
        {facility.crisis_line && (
          <Badge label="Crisis Line" variant="warning" icon="alert-circle-outline" />
        )}
        {facility.ages_served === 'All ages' && (
          <Badge label="All Ages" variant="inPerson" icon="people-outline" />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.paymentRow}>
          {facility.payment.slice(0, 2).map((p, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>{p}</Text>
            </View>
          ))}
          {facility.payment.length > 2 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>+{facility.payment.length - 2}</Text>
            </View>
          )}
        </View>
        {facility.languages?.length > 0 && (
          <View style={styles.langRow}>
            <Ionicons name="language-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.langText} numberOfLines={1}>
              {facility.languages.slice(0, 2).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    ...Shadows.md,
  },
  topRow: { flexDirection: 'row', marginBottom: 12 },
  iconContainer: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  mainInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  name: { ...Typography.heading4, lineHeight: 22 },
  costPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
    marginBottom: 4,
  },
  costPillText: { fontSize: 11, fontWeight: '700' },
  typePill: {
    backgroundColor: Colors.surfaceAlt,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  typePillText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: Colors.textTertiary },
  snippet: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  chip: {
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, maxWidth: 120,
  },
  chipText: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  langText: { fontSize: 12, color: Colors.textTertiary },
});
