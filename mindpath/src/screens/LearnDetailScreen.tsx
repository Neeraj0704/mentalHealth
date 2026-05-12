import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';

import { BASE_URL } from '../config';

type Props = NativeStackScreenProps<LearnStackParamList, 'LearnDetail'>;

interface ConditionDetail {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  tagline: string;
  overview: string;
  symptoms: string[];
  types: string[];
  when_to_seek_help: string;
  treatments: string[];
  source: string;
}

interface QAItem {
  question: string;
  answer: string;
  source: string;
}

export default function LearnDetailScreen({ navigation, route }: Props) {
  const { conditionId } = route.params;
  const [condition, setCondition] = useState<ConditionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/learn/conditions/${conditionId}`)
      .then(r => r.json())
      .then(d => { setCondition(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [conditionId]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setQuestion('');
    setAsking(true);
    try {
      const res = await fetch(`${BASE_URL}/learn/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, condition_id: conditionId }),
      });
      const data = await res.json();
      setQaHistory(prev => [...prev, { question: q, answer: data.answer, source: data.source }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch {
      setQaHistory(prev => [...prev, { question: q, answer: 'Could not get an answer. Please try again.', source: '' }]);
    } finally {
      setAsking(false);
    }
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1, marginTop: 80 }} />;
  if (!condition) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{condition.title}</Text>
          <View style={{ width: 38 }} />
        </SafeAreaView>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: condition.bg, borderColor: condition.color + '33' }]}>
            <View style={[styles.heroIcon, { backgroundColor: condition.color + '22' }]}>
              <Ionicons name={condition.icon as any} size={32} color={condition.color} />
            </View>
            <Text style={[styles.heroTagline, { color: condition.color }]}>{condition.tagline}</Text>
            <Text style={styles.heroOverview}>{condition.overview}</Text>
          </View>

          {/* Symptoms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Symptoms</Text>
            {condition.symptoms.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: condition.color }]} />
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Types */}
          {condition.types?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Types</Text>
              <View style={styles.chipRow}>
                {condition.types.map((t, i) => (
                  <View key={i} style={[styles.typeChip, { borderColor: condition.color + '44', backgroundColor: condition.bg }]}>
                    <Text style={[styles.typeChipText, { color: condition.color }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* When to seek help */}
          <View style={[styles.section, styles.seekHelpCard]}>
            <View style={styles.seekHelpHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#b45309" />
              <Text style={styles.seekHelpTitle}>When to seek help</Text>
            </View>
            <Text style={styles.seekHelpText}>{condition.when_to_seek_help}</Text>
          </View>

          {/* Treatments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Treatments</Text>
            {condition.treatments.map((t, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={condition.color} />
                <Text style={styles.bulletText}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Find providers CTA */}
          <TouchableOpacity
            style={[styles.findBtn, { backgroundColor: condition.color }]}
            onPress={() => navigation.navigate('LearnResults', { query: condition.title, specialty: condition.title })}
            activeOpacity={0.85}
          >
            <Ionicons name="search-outline" size={18} color="#fff" />
            <Text style={styles.findBtnText}>Find providers for {condition.title}</Text>
          </TouchableOpacity>

          {/* Source */}
          <View style={styles.sourceRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.sourceText}>Source: {condition.source}</Text>
          </View>

          {/* Q&A section */}
          <View style={styles.qaSection}>
            <Text style={styles.qaSectionTitle}>Ask a question</Text>
            <Text style={styles.qaSectionSub}>Answers are based on NIMH and APA clinical guidelines only.</Text>

            {qaHistory.map((item, i) => (
              <View key={i} style={styles.qaItem}>
                <View style={styles.qaQuestion}>
                  <Ionicons name="person-outline" size={14} color={Colors.primary} />
                  <Text style={styles.qaQuestionText}>{item.question}</Text>
                </View>
                <View style={styles.qaAnswer}>
                  <Ionicons name="aperture-outline" size={14} color={Colors.textTertiary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qaAnswerText}>{item.answer}</Text>
                    {item.source && <Text style={styles.qaSource}>Source: {item.source}</Text>}
                  </View>
                </View>
              </View>
            ))}

            {asking && (
              <View style={styles.qaAnswer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={{ fontSize: 13, color: Colors.textTertiary, marginLeft: 8 }}>Looking up answer...</Text>
              </View>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Question input */}
        <SafeAreaView edges={['bottom']} style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={`Ask about ${condition.title}...`}
              placeholderTextColor={Colors.textTertiary}
              value={question}
              onChangeText={setQuestion}
              returnKeyType="send"
              onSubmitEditing={handleAsk}
              multiline={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!question.trim() || asking) && styles.sendBtnDisabled]}
              onPress={handleAsk}
              disabled={!question.trim() || asking}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, ...Shadows.xs,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.heading4, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  content: { padding: Spacing.md, gap: 16, paddingBottom: 20 },
  hero: { borderRadius: Radius.lg, padding: Spacing.md, gap: 10, borderWidth: 1 },
  heroIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroTagline: { fontSize: 13, fontWeight: '700', fontStyle: 'italic' },
  heroOverview: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  section: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadows.sm },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5 },
  typeChipText: { fontSize: 12, fontWeight: '600' },
  seekHelpCard: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  seekHelpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seekHelpTitle: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  seekHelpText: { fontSize: 13, color: '#92400e', lineHeight: 20 },
  findBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: Radius.full, paddingVertical: 16,
  },
  findBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  sourceText: { fontSize: 11, color: Colors.textTertiary },
  qaSection: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 12, ...Shadows.sm },
  qaSectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  qaSectionSub: { fontSize: 12, color: Colors.textTertiary, marginTop: -6 },
  qaItem: { gap: 8 },
  qaQuestion: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primaryBg, borderRadius: Radius.md, padding: 10 },
  qaQuestionText: { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1 },
  qaAnswer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 4 },
  qaAnswerText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  qaSource: { fontSize: 11, color: Colors.textTertiary, marginTop: 4, fontStyle: 'italic' },
  inputBar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.divider, paddingHorizontal: Spacing.md, paddingTop: 10, paddingBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderColor: Colors.border },
  input: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
