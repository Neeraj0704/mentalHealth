import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'SOSResources'>;

const RESOURCES = [
  {
    label: '988 Suicide & Crisis Lifeline',
    sub: 'Call or text 988. Free, confidential, 24/7',
    icon: 'call-outline' as const,
    color: '#C0392B',
    bg: '#FEF0F0',
    action: () => Linking.openURL('tel:988'),
  },
  {
    label: 'Crisis Text Line',
    sub: 'Text HOME to 741741. Free, confidential, 24/7',
    icon: 'chatbubble-outline' as const,
    color: '#8B6BAF',
    bg: '#F7EEF9',
    action: () => Linking.openURL('sms:741741&body=HOME'),
  },
  {
    label: 'NAMI Helpline',
    sub: 'Call 1-800-950-6264. Mental health information and support',
    icon: 'heart-outline' as const,
    color: '#2E6A7E',
    bg: '#EEF6F9',
    action: () => Linking.openURL('tel:18009506264'),
  },
  {
    label: 'Emergency Services',
    sub: 'Call 911 for immediate danger',
    icon: 'alert-circle-outline' as const,
    color: '#E8956A',
    bg: '#FDF0E8',
    action: () => Linking.openURL('tel:911'),
  },
];

export default function SOSScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Crisis Resources</Text>
          <Text style={styles.subtitle}>You don't have to face this alone</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.urgentBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#92400e" />
          <Text style={styles.urgentText}>
            If you are in immediate danger, call 911 or go to your nearest emergency room.
          </Text>
        </View>

        {RESOURCES.map((res, i) => (
          <TouchableOpacity key={i} style={styles.card} onPress={res.action} activeOpacity={0.85}>
            <View style={[styles.iconWrap, { backgroundColor: res.bg }]}>
              <Ionicons name={res.icon} size={24} color={res.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{res.label}</Text>
              <Text style={styles.cardSub}>{res.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Find a provider</Text>

        <TouchableOpacity
          style={styles.providerBtn}
          onPress={() => navigation.navigate('Results', { query: '', specialty: undefined })}
          activeOpacity={0.85}
        >
          <Ionicons name="search-outline" size={20} color={Colors.primary} />
          <Text style={styles.providerBtnText}>Search mental health providers near me</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          These resources are available 24/7 and are completely confidential.{'\n'}
          Reaching out is a sign of strength.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1,
    borderBottomColor: Colors.divider, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  titleSection: { flex: 1 },
  title: { ...Typography.heading4, letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },
  content: { padding: Spacing.md, gap: 12, paddingBottom: 60 },
  urgentBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fef3c7', borderRadius: Radius.md,
    padding: 14, borderWidth: 1, borderColor: '#fde68a',
  },
  urgentText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadows.sm,
  },
  iconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  divider: { height: 1, backgroundColor: Colors.divider },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  providerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryBg, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.primary + '44',
  },
  providerBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },
  footerNote: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
});
