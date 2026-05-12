import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { generateConversationSummary } from '../services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'AssessmentResult'>;

function getSeverityColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes('minimal') || s.includes('low') || s.includes('unlikely')) return '#22c55e';
  if (s.includes('mild')) return '#f59e0b';
  if (s.includes('moderately severe')) return '#f97316';
  if (s.includes('moderate')) return '#f97316';
  if (s.includes('severe') || s.includes('consistent') || s.includes('positive')) return '#ef4444';
  return Colors.primary;
}

function getConditionDescription(condition: string, severity: string): string {
  const sev = severity.toLowerCase();
  if (condition === 'Depression') {
    if (sev.includes('minimal')) return "Your responses suggest minimal depressive symptoms. It's still worth speaking with someone if things feel heavy.";
    if (sev.includes('mild')) return "Based on your responses, you may be experiencing mild depression. A mental health provider can help you feel better.";
    if (sev.includes('moderate')) return "Your responses indicate moderate depression. Connecting with a therapist or psychiatrist can make a real difference.";
    return "Your responses suggest significant depression. Speaking with a mental health professional is strongly recommended.";
  }
  if (condition === 'Anxiety') {
    if (sev.includes('minimal')) return "Your responses suggest minimal anxiety. Talking to a provider can still help with day-to-day stress.";
    if (sev.includes('mild')) return "Based on your responses, you may be experiencing mild anxiety. A therapist can help you develop coping strategies.";
    if (sev.includes('moderate')) return "Your responses indicate moderate anxiety. Connecting with a specialist can help you manage these feelings.";
    return "Your responses suggest significant anxiety. Speaking with a mental health professional is strongly recommended.";
  }
  if (condition === 'ADHD') {
    return sev.includes('consistent')
      ? "Your responses are consistent with ADHD symptoms. A specialist can provide a formal evaluation and personalized support."
      : "Your responses don't strongly suggest ADHD, but a provider can still help if focus difficulties are affecting your daily life.";
  }
  if (condition === 'Trauma') {
    return sev.includes('positive')
      ? "Your responses indicate significant trauma-related symptoms. A trauma-informed therapist can offer effective, compassionate care."
      : "Your responses show some stress-related symptoms. A provider can help you work through what you've experienced.";
  }
  return `Based on your responses, connecting with a mental health provider who specializes in ${condition.toLowerCase()} can help.`;
}

export default function AssessmentResultScreen({ navigation, route }: Props) {
  const { condition, severity, score, instrumentId, qaItems, conversation } = route.params;
  const severityColor = getSeverityColor(severity);
  const description = getConditionDescription(condition, severity);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    generateConversationSummary(conversation, qaItems, condition)
      .then(s => setSummary(s))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.getParent()?.navigate('HomeTab')} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Results', { query: condition, specialty: condition })}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Condition card */}
        <View style={styles.conditionCard}>
          <View style={styles.conditionHeader}>
            <View style={styles.conditionLeft}>
              <Text style={styles.conditionName}>{condition}</Text>
              <View style={[styles.severityChip, { backgroundColor: severityColor + '20', borderColor: severityColor + '44' }]}>
                <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
                <Text style={[styles.severityLabel, { color: severityColor }]}>{severity}</Text>
              </View>
            </View>
            <View style={[styles.checkCircle, { backgroundColor: severityColor }]}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          </View>
          <Text style={styles.conditionDescription}>{description}</Text>
          {score > 0 && (
            <Text style={styles.scoreNote}>Score: {score} · {instrumentId.replace(/(\d)/, '-$1')}</Text>
          )}
        </View>

        {/* Conversation summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.cardTitle}>Conversation Summary</Text>
          </View>
          {summaryLoading ? (
            <View style={styles.summaryLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.summaryLoadingText}>Generating summary...</Text>
            </View>
          ) : summary ? (
            <Text style={styles.summaryProse}>{summary}</Text>
          ) : (
            <Text style={styles.summaryProse}>
              Based on the conversation, {condition.toLowerCase()}-related concerns were identified.
            </Text>
          )}
        </View>

        {/* Instrument Q&A */}
        {qaItems.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.cardTitle}>Your responses</Text>
              <View style={styles.instrumentBadge}>
                <Text style={styles.instrumentBadgeText}>{instrumentId.replace(/(\d)/, '-$1')}</Text>
              </View>
            </View>
            {qaItems.map((item, i) => (
              <View key={i} style={[styles.qaItem, i < qaItems.length - 1 && styles.qaItemBorder]}>
                <Text style={styles.qaQuestion}>{item.question}</Text>
                <Text style={styles.qaAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.findBtn}
            onPress={() => navigation.navigate('Results', { query: condition, specialty: condition })}
            activeOpacity={0.85}
          >
            <Text style={styles.findBtnText}>Find Providers</Text>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Results', { query: '' })}
            activeOpacity={0.7}
          >
            <Text style={styles.exploreLink}>Explore on my own</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  skipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 48, gap: 16 },

  conditionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 20,
    ...Shadows.md,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conditionLeft: { flex: 1, gap: 8 },
  conditionName: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 5,
  },
  severityDot: { width: 7, height: 7, borderRadius: 4 },
  severityLabel: { fontSize: 13, fontWeight: '600' },
  checkCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  conditionDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  scoreNote: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    ...Shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  instrumentBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  instrumentBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  summaryProse: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  summaryLoadingText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  qaItem: { paddingVertical: 10 },
  qaItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  qaQuestion: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 3 },
  qaAnswer: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  actions: { gap: 12, alignItems: 'center', marginTop: 8 },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    width: '100%',
    ...Shadows.md,
  },
  findBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  exploreLink: { fontSize: 14, color: Colors.textTertiary, fontWeight: '500' },
});
