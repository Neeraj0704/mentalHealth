import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Linking, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'SOSResources'>;

const { width } = Dimensions.get('window');

export default function SOSScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero header */}
      <LinearGradient
        colors={['#7B1F1F', '#B03030', '#C0392B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="heart" size={16} color="#fff" />
              <Text style={styles.heroBadgeText}>Crisis Support</Text>
            </View>
            <Text style={styles.heroTitle}>You are not alone</Text>
            <Text style={styles.heroSub}>
              Help is available right now — free, confidential, and 24/7
            </Text>
          </View>

          {/* 988 hero CTA */}
          <TouchableOpacity
            style={styles.heroCallBtn}
            onPress={() => Linking.openURL('tel:988')}
            activeOpacity={0.88}
          >
            <View style={styles.heroCallLeft}>
              <View style={styles.heroCallIcon}>
                <Ionicons name="call" size={24} color="#C0392B" />
              </View>
              <View>
                <Text style={styles.heroCallNumber}>Call or Text 988</Text>
                <Text style={styles.heroCallSub}>Suicide & Crisis Lifeline · Free · 24/7</Text>
              </View>
            </View>
            <View style={styles.heroCallArrow}>
              <Ionicons name="arrow-forward" size={18} color="#C0392B" />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Crisis Text Line */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Prefer to text?</Text>
        </View>

        <TouchableOpacity
          style={[styles.card, styles.textCard]}
          onPress={() => Linking.openURL('sms:741741&body=HOME')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#F0E8FA' }]}>
            <Ionicons name="chatbubble-ellipses" size={22} color="#7B3FA0" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Crisis Text Line</Text>
            <Text style={styles.cardDesc}>Text <Text style={styles.bold}>HOME</Text> to <Text style={styles.bold}>741741</Text></Text>
            <Text style={styles.cardMeta}>Free · Confidential · 24/7</Text>
          </View>
          <View style={[styles.actionChip, { backgroundColor: '#7B3FA0' }]}>
            <Text style={styles.actionChipText}>Text</Text>
          </View>
        </TouchableOpacity>

        {/* Other resources */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Other resources</Text>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => Linking.openURL('tel:18009506264')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#E8F4F8' }]}>
            <Ionicons name="people" size={22} color="#2E6A7E" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>NAMI Helpline</Text>
            <Text style={styles.cardDesc}>1-800-950-NAMI (6264)</Text>
            <Text style={styles.cardMeta}>Mental health info & support</Text>
          </View>
          <View style={[styles.actionChip, { backgroundColor: '#2E6A7E' }]}>
            <Text style={styles.actionChipText}>Call</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.emergencyCard]}
          onPress={() => Linking.openURL('tel:911')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#FEF0F0' }]}>
            <Ionicons name="alert-circle" size={22} color="#C0392B" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Emergency Services</Text>
            <Text style={styles.cardDesc}>Call 911</Text>
            <Text style={styles.cardMeta}>Immediate danger or medical emergency</Text>
          </View>
          <View style={[styles.actionChip, { backgroundColor: '#C0392B' }]}>
            <Text style={styles.actionChipText}>Call</Text>
          </View>
        </TouchableOpacity>

        {/* Find a provider */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Looking for ongoing support?</Text>
        </View>

        <TouchableOpacity
          style={styles.providerBtn}
          onPress={() => navigation.navigate('Results', { query: '', specialty: undefined })}
          activeOpacity={0.85}
        >
          <Ionicons name="search-outline" size={20} color={Colors.primary} />
          <Text style={styles.providerBtnText}>Find a mental health provider near you</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.footerText}>
            All resources are free and 100% confidential. Reaching out takes courage.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  heroGradient: {},
  heroInner: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroContent: { marginBottom: Spacing.lg },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: 12,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 21,
  },

  heroCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
  },
  heroCallLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  heroCallIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCallNumber: { fontSize: 17, fontWeight: '800', color: '#C0392B', letterSpacing: -0.3 },
  heroCallSub: { fontSize: 12, color: '#888', marginTop: 2 },
  heroCallArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: Spacing.md, gap: 10, paddingBottom: 60 },

  sectionHeader: { marginTop: 6, marginBottom: -2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  textCard: {
    borderWidth: 1.5,
    borderColor: '#E8D8F5',
  },
  emergencyCard: {
    borderWidth: 1.5,
    borderColor: '#FACACA',
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary },
  cardMeta: { fontSize: 11, color: Colors.textTertiary },
  bold: { fontWeight: '700', color: Colors.textPrimary },

  actionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  actionChipText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary + '33',
    marginTop: 4,
  },
  providerBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
