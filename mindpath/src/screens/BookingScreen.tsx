import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius } from '../theme';
import { bookAppointment } from '../services/api';
import { getAssessmentSummary, getPreferences } from '../services/preferences';

type Props = NativeStackScreenProps<HomeStackParamList, 'Booking'>;

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

export default function BookingScreen({ navigation, route }: Props) {
  const { providerId, providerName } = route.params;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('Anytime');
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState<{ condition?: string; severity?: string; score?: number; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAssessmentSummary().then(s => setSummary(s));
    getPreferences().then(p => {
      if (p.displayName) setName(p.displayName);
    });
  }, []);

  const canSubmit = name.trim() && email.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await bookAppointment({
        provider_id: providerId,
        provider_name: providerName,
        user_name: name.trim(),
        user_email: email.trim(),
        user_phone: phone.trim() || undefined,
        preferred_time: preferredTime,
        message: message.trim() || undefined,
        assessment_condition: summary?.condition,
        assessment_severity: summary?.severity,
        assessment_score: summary?.score,
        assessment_message: summary?.message,
      });
      setSubmitted(true);
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Request Sent!</Text>
          <Text style={styles.successSub}>
            Your appointment request has been sent to{' '}
            <Text style={{ fontWeight: '700' }}>{providerName}</Text>.
          </Text>
          {summary?.condition && (
            <View style={styles.summarySharedCard}>
              <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
              <Text style={styles.summarySharedText}>
                Your{' '}
                <Text style={{ fontWeight: '600' }}>{summary.condition}</Text>
                {summary.severity ? ` (${summary.severity})` : ''} assessment was shared with the provider.
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Request Appointment</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{providerName}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Assessment summary will be shared */}
        {summary?.condition && (
          <View style={styles.summaryBanner}>
            <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
            <Text style={styles.summaryBannerText}>
              Your <Text style={{ fontWeight: '700' }}>{summary.condition}</Text>
              {summary.severity ? ` · ${summary.severity}` : ''} assessment will be shared with the provider.
            </Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Your name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
        />

        <Text style={styles.fieldLabel}>Email address *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.fieldLabel}>Phone (optional)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="phone-pad"
        />

        <Text style={styles.fieldLabel}>Preferred time</Text>
        <View style={styles.chipRow}>
          {TIME_OPTIONS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, preferredTime === t && styles.chipSelected]}
              onPress={() => setPreferredTime(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, preferredTime === t && styles.chipTextSelected]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Message (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Anything you'd like the provider to know before your first session…"
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <View style={{ height: 30 }} />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Text style={styles.submitBtnText}>Send Request</Text>
                <Ionicons name="send" size={16} color="#fff" />
              </>
          }
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    paddingHorizontal: Spacing.md, paddingBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: Spacing.sm },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.2 },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  content: { padding: Spacing.md, paddingBottom: 20 },
  summaryBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '33',
    marginBottom: 20,
  },
  summaryBannerText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 19 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: Colors.textPrimary,
  },
  textArea: { height: 110, paddingTop: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  errorText: { fontSize: 13, color: Colors.error, marginTop: 12, textAlign: 'center' },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.divider,
    paddingHorizontal: Spacing.md, paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.md,
  },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, letterSpacing: -0.3 },
  successSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20, maxWidth: 280 },
  summarySharedCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.md, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '33',
    marginBottom: 32, maxWidth: 320,
  },
  summarySharedText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 19 },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16, paddingHorizontal: 40,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
