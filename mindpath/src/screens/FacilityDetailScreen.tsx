import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Facility } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';
import { useSaved } from '../context/SavedContext';

const BASE_URL = 'http://localhost:8000';

type Props = NativeStackScreenProps<HomeStackParamList, 'FacilityDetail'>;

function PaymentTag({ label }: { label: string }) {
  const low = label.toLowerCase();
  const isFree = low.includes('free');
  const isSliding = low.includes('sliding');
  const isMedicaid = low.includes('medicaid');
  const bg = isFree ? '#dcfce7' : isSliding ? '#fef3c7' : isMedicaid ? '#e0f2fe' : Colors.surfaceAlt;
  const color = isFree ? '#16a34a' : isSliding ? '#b45309' : isMedicaid ? '#0369a1' : Colors.textSecondary;
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.infoValueLink]}>{value}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </TouchableOpacity>
  );
}

export default function FacilityDetailScreen({ navigation, route }: Props) {
  const { facilityId } = route.params;
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggleSavedFacility, isFacilitySaved } = useSaved();

  useEffect(() => {
    fetch(`${BASE_URL}/facilities/${facilityId}`)
      .then(r => r.json())
      .then(data => { setFacility(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [facilityId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!facility) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load clinic details.</Text>
      </View>
    );
  }

  const isFree = facility.payment.some(p => p.toLowerCase().includes('free'));
  const isSliding = facility.payment.some(p => p.toLowerCase().includes('sliding'));
  const costLabel = isFree ? 'Free' : isSliding ? 'Low-Cost' : 'Insurance / Self-Pay';
  const costColor = isFree ? '#16a34a' : isSliding ? '#b45309' : Colors.textSecondary;
  const costBg = isFree ? '#dcfce7' : isSliding ? '#fef3c7' : Colors.surfaceAlt;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Clinic Details</Text>
        <TouchableOpacity onPress={() => facility && toggleSavedFacility(facility)} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons
            name={facility && isFacilitySaved(facility.id) ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={facility && isFacilitySaved(facility.id) ? Colors.primary : Colors.textPrimary}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={[styles.costBadge, { backgroundColor: costBg }]}>
            <Text style={[styles.costBadgeText, { color: costColor }]}>{costLabel}</Text>
          </View>
          <Text style={styles.name}>{facility.name}</Text>
          <Text style={styles.address}>{facility.address}</Text>
          <View style={styles.badgeRow}>
            {facility.telehealth && (
              <View style={styles.badge}>
                <Ionicons name="videocam-outline" size={13} color={Colors.primary} />
                <Text style={styles.badgeText}>Telehealth</Text>
              </View>
            )}
            {facility.inpatient_outpatient ? (
              <View style={styles.badge}>
                <Ionicons name="business-outline" size={13} color={Colors.primary} />
                <Text style={styles.badgeText}>{facility.inpatient_outpatient}</Text>
              </View>
            ) : null}
            {facility.acuity ? (
              <View style={styles.badge}>
                <Ionicons name="pulse-outline" size={13} color={Colors.primary} />
                <Text style={styles.badgeText}>{facility.acuity}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={facility.phone}
            onPress={() => Linking.openURL(`tel:${facility.phone}`)}
          />
          {facility.website ? (
            <InfoRow
              icon="globe-outline"
              label="Website"
              value={facility.website.replace(/^https?:\/\//, '')}
              onPress={() => Linking.openURL(facility.website)}
            />
          ) : null}
          {facility.google_maps_link ? (
            <InfoRow
              icon="location-outline"
              label="Directions"
              value="Open in Maps"
              onPress={() => Linking.openURL(facility.google_maps_link)}
            />
          ) : null}
          {facility.crisis_line ? (
            <InfoRow
              icon="warning-outline"
              label="Crisis Line"
              value={facility.crisis_line}
              onPress={() => Linking.openURL(`tel:${facility.crisis_line}`)}
            />
          ) : null}
        </View>

        {/* Hours */}
        {facility.hours ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hours</Text>
            <Text style={styles.bodyText}>{facility.hours}</Text>
          </View>
        ) : null}

        {/* Services */}
        {facility.services?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Services</Text>
            {facility.services.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment */}
        {facility.payment?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Options</Text>
            <View style={styles.tagRow}>
              {facility.payment.map((p, i) => <PaymentTag key={i} label={p} />)}
            </View>
          </View>
        )}

        {/* Languages */}
        {facility.languages?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Languages</Text>
            <Text style={styles.bodyText}>{facility.languages.join(', ')}</Text>
          </View>
        )}

        {/* Ages & Acuity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Info</Text>
          {facility.ages_served ? (
            <InfoRow icon="people-outline" label="Ages Served" value={facility.ages_served} />
          ) : null}
          {facility.emergency_serves ? (
            <InfoRow
              icon="alert-circle-outline"
              label="Emergency Services"
              value={facility.emergency_serves}
            />
          ) : null}
          {facility.num_of_beds > 0 ? (
            <InfoRow icon="bed-outline" label="Beds" value={String(facility.num_of_beds)} />
          ) : null}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: Colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...Shadows.xs,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', ...Typography.heading4 },
  content: { padding: Spacing.md, paddingBottom: 60, gap: 12 },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  costBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, marginBottom: 10,
  },
  costBadgeText: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 6 },
  address: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { ...Typography.heading4, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  infoValueLink: { color: Colors.primary },
  bodyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  tagText: { fontSize: 12, fontWeight: '600' },
});
