import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Consent'>;

const { height } = Dimensions.get('window');

const CONSENT_ITEMS = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Not a medical service',
    body: 'MindPath is a provider directory and screening tool. It does not provide medical diagnoses, treatment plans, or clinical advice. Always consult a licensed professional for medical decisions.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Your data stays private',
    body: 'Your responses are used only to match you with relevant providers. We do not sell, share, or store your personal health information without your explicit consent.',
  },
  {
    icon: 'chatbubble-outline' as const,
    title: 'AI-assisted screening',
    body: 'Mira uses AI to guide you through validated clinical instruments (GAD-7, PHQ-9, etc.). These are screening tools only, not a clinical diagnosis.',
  },
  {
    icon: 'call-outline' as const,
    title: 'Crisis resources',
    body: 'If you are in crisis or experiencing a mental health emergency, please call or text 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.',
  },
];

export default function ConsentScreen({ navigation }: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E6A7E', '#4A8B9F']} style={styles.topBand}>
        <SafeAreaView edges={['top']} style={styles.topInner}>
          <View style={styles.logoRow}>
            <Ionicons name="aperture-outline" size={28} color="#fff" />
            <Text style={styles.appName}>MindPath</Text>
          </View>
          <Text style={styles.heading}>Before you begin</Text>
          <Text style={styles.subheading}>Please read and agree to the following before using the app.</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CONSENT_ITEMS.map((item, i) => (
          <View key={i} style={styles.item}>
            <View style={styles.itemIcon}>
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
            </View>
          </View>
        ))}

        {/* Agreement checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAgreed(v => !v)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkLabel}>
            I understand that MindPath is not a medical service and I agree to use it accordingly.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.agreeBtn, !agreed && styles.agreeBtnDisabled]}
          onPress={() => agreed && navigation.replace('Onboarding')}
          activeOpacity={agreed ? 0.85 : 1}
        >
          <Text style={styles.agreeBtnText}>I Agree & Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          For emergencies, call 988 or visit your nearest emergency room.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBand: { paddingBottom: Spacing.xl },
  topInner: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  appName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heading: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: 12, paddingBottom: 24 },
  item: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  itemIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  itemBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: 4,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  footer: {
    paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  agreeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingVertical: 16,
  },
  agreeBtnDisabled: { backgroundColor: Colors.border },
  agreeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footerNote: {
    fontSize: 11, color: Colors.textTertiary,
    textAlign: 'center', marginTop: 10,
  },
});
